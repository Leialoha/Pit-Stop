import { Condition, Expression, PipelineStage, Types } from "mongoose";
import { GroupUser, UserLookup, UserReference } from "../../database";
import { validatePhoneNumber, validateObjectID } from "../../utils/validators";
import { DalPipelines } from "./types";
import { AnyExpression } from "mongoose";


// Helper functions to extract valid phones and object IDs from user lookups
function fetchPhones(...details: UserLookup[]): string[] {
    return details
        .filter(d => d.phone)
        .map(d => validatePhoneNumber(d.phone))
        .filter(p => p.isValid)
        .map(p => p.phone);
}

function fetchObjectIDs(...details: UserLookup[]): Types.ObjectId[] {
    return details
        .filter(d => d.userID)
        .map(d => validateObjectID(d.userID))
        .filter(id => id.isValid)
        .map(id => id._id);
}

function quickCondition(check: Expression, trueResult: AnyExpression, falseResult: AnyExpression): Expression.Cond {
    return { $cond: { if: check, then: trueResult, else: falseResult } };
};


// Additional pipeline definitions
function lookupUsersPipeline(self: UserReference, ...details: UserLookup[]) : PipelineStage[] {
    return [
        { $addFields: {
            lookupBy: { $cond: {
                if: { $in: [ '$_id', fetchObjectIDs(...details) ] },
                then: 'IDENTIFIER',
                else: { $cond: {
                    if: { $in: [ '$phone', fetchPhones(...details) ] },
                    then: 'PHONE',
                    else: 'NONE'
                } }
            } },
            requestedBy: { $cond: {
                if: { $eq: [ self?.phone, null ] },
                then: 'UNKNOWN',
                else: 'USER'
            } }
        } },
        { $match: { $expr: { $not: { $eq: [ '$lookupBy', 'NONE' ] } } } },
        isSelfPipelineStage(self)
    ];
}

function isSelfPipelineStage(self: UserReference | null): PipelineStage {
    return { $addFields: { isSelf: { $eq: ['$phone', self?.phone] } } };
};

// Dal pipeline definitions
export const queries: DalPipelines = {
    // --------------
    // User pipelines
    // --------------

    // Lookup single user by phone number or ID
    "users.lookupUser": lookupUsersPipeline,

    // Lookup multiple users by phone numbers or IDs
    "users.lookupUsers": (self: UserReference, details: UserLookup[]) => lookupUsersPipeline(self, ...details),

    // Mask email and phone if not self
    "users.maskDetails": (self: UserReference) => [
        // Flag if the current document is should be masked
        { $addFields: { shouldMask: { $not: '$isSelf' } } },

        // Masking logic for email
        // Preserving first and last character of each segment
        { $addFields: { email: { $cond: {
            if: '$shouldMask',
            else: '$email',
            then: {
                original: '$email',
                matches: { $map: {
                    // Find all segments to mask
                    // i.e., parts after (beginning character) and '@'
                    // Example: "user@example.com" -> ["ser", "xample"]
                    input: { $regexFindAll: { input: '$email', regex: '(?!^)[^@\n]+(?=@|\\.(?![^.@]+\\.))' } },
                    // For each segment, get its index and size
                    // to help with reconstruction later
                    in: { index: '$$this.idx', size: { $strLenCP: '$$this.match' } }
                } },
                // provide a replacement string of asterisks
                // with the same length as the original email
                replacement: { $reduce: {
                    initialValue: '',
                    in: { $concat: [ '$$value', '*' ] },
                    input: { $regexFindAll: { input: '$email', regex: '' } }
                } }
            }
        } } } },
        // Final reconstruction of masked phone and email
        { $addFields: {
            phone: { $cond: {
                if: '$shouldMask',
                else: '$phone',
                then: { $concat: [ '+',
                    // Show last 4 digits, mask rest with asterisks
                    // e.g., +01234567890 -> +*********7890
                    // This assumes country code is included in the phone number
                    { $substr: [ '*******************', 1, { $subtract: [{ $strLenCP: '$phone' }, 5] } ] },
                    { $substr: [ '$phone', { $subtract: [{ $strLenCP: '$phone' }, 4] }, 4 ] }
                ] }
            } },
            email: { $cond: {
                if: '$shouldMask',
                else: '$email',
                then: { $concat: [
                    // Reconstruct masked email using original and replacement strings
                    // by piecing together unmasked characters and asterisks
                    // e.g., "user@email.com" -> "u***@e****.com"
                    { $substr: [ '$email.original', 0, 1 ] },
                    { $substr: [ '$email.replacement', { $first: '$email.matches.index' }, { $first: '$email.matches.size' } ] },
                    { $substr: [ '$email.original', { $add: [ { $first: '$email.matches.index' }, { $first: '$email.matches.size' } ] }, 1 ] },
                    { $substr: [ '$email.replacement', { $last: '$email.matches.index' }, { $last: '$email.matches.size' } ] },
                    { $substr: [ '$email.original', { $add: [ { $last: '$email.matches.index' }, { $last: '$email.matches.size' } ] }, 99 ] },
                ] }
            } }
        } }
    ],

    // Hide name, phone, and email if not self
    "users.hideDetails": (self: UserReference) => [
        { $addFields: {
            shouldHide: { $and: [
                { $not: '$isSelf' },
                { $or: [
                    { $eq: [ '$lookupBy', 'PHONE' ] },
                    { $eq: [ '$requestedBy', 'UNKNOWN' ] }
                ] },
            ] }
        } },
        { $addFields: {
            _id: quickCondition('$shouldHide', null, '$_id'),
            name: quickCondition('$shouldHide', 'Anonymous User', '$name'),
            phone: quickCondition('$shouldHide', null, '$phone'),
            email: quickCondition('$shouldHide', null, '$email'),
        } }
    ],

    // Lookup self by phone number
    "users.lookupSelf": (self: UserReference) => [
        { $match: { phone: self?.phone } },
        isSelfPipelineStage(self)
    ],

    "users.makeFake": (self: UserReference) => [
        // Group users if any match found 
        { $facet: { users: [] } },
        // Replace root with first user found
        // or create new fake user object
        { $replaceRoot: { newRoot: { $ifNull: [
            { $first: '$users' },
            { 
                _id: null,
                phone: "+12223334444",
                name: "Anonymous User",
                email: "anonymous-user@anonymous.com",
                __v: 0,
                lookupBy: 'UNKNOWN',
                requestedBy: "UNKNOWN",
            }
        ] } } }
    ],

    // Get temporary user by phone number
    "users.getTempUser": (self: UserReference, details: UserLookup ) => [
        // Group users if any match found 
        { $facet: { users: [] } },
        // Replace root with first user found
        // or create new temp user object
        { $replaceRoot: { newRoot: { $ifNull: [
            { $first: '$users' },
            { phone: details.phone }
        ] } } },
        // Add 'exists' field to indicate if user was found
        { $addFields: { exists: { $cond: { if: '$_id', then: true, else: false } } } }
    ],

    // Remove lookup details
    "users.removeLookupDetails": [
        { $unset: [ 'lookupBy', 'requestedBy', 'isSelf', 'shouldMask', 'shouldHide' ] }
    ],

    // ---------------
    // Group pipelines
    // ---------------


    "group.ignored": (self: UserReference, details: GroupUser) => []
} as const;
