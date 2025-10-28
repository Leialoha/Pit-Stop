> [!NOTE]
> Everything that is checked off is going to be / or already implemented.
> 
> Attachments might not be implemented (takes up too much memory)

### 🚗 **Vehicle Information**

- [x] **Vehicle ID** - Unique entry ID. (internal)
- [x] **Name** - Display name (required)
- [x] **Make** - Manufacturer (required)
- [x] **Model** - Vehicle model (required)
- [x] **Year** - Model year. (required)
- [x] **VIN** - Vehicle Identification Number
- [x] **License Plate** - Optional for quick reference
- [x] **Odometer** - Latest mileage reading

---

### 🧰 **Maintenance / Service Records**

- [x] **Service Id**: - Unique ID of the service (internal)
- [x] **Vehicle Id**: - Unique ID of the vehicle (internal)
- [x] **Record Id**: - Unique ID of the expense (internal)
- [x] **Odometer At Service**:  - Mileage at the time of service
- [x] **Service Type / Category**:  - Oil Change, Tire Rotation, Brake Service, etc (Required)
- [x] **Next Due Date / Mileage** - For scheduling reminders
- [x] **Labor Cost**  - Cost of the work
- [x] **Parts Cost**  - Cost of materials used
- [x] **Attachments / Receipt Image** - For digital copies of invoices

---

### ⛽ **Fuel / Running Costs (optional but useful)**
> See [Receipts / Expenses](#-receipts--expenses)

- [x] **Date** - When you refueled (required)
- [x] **Odometer** - Mileage at fill-up
- [x] **Fuel Volume (gal/L)** - Amount filled
- [x] **Cost per Unit** - Cost per gallon/liter
- [x] **Total Cost** - Total fuel cost (required)
- [x] **Fuel Type** - Regular, Premium, Diesel, etc
- [x] **Station / Location** - Where you filled up
- [x] **Attachment** - Image or PDF of the receipt

---

### 🧾 **Receipts / Expenses**

- [x] **Record Id** - Unique ID of the expense (internal)
- [x] **Vehicle Id** - Unique ID of the vehicle (internal)
- [x] **Date** - Purchase date (Required)
- [x] **Vendor** - Store or service center (Required)
- [x] **Was Serviced** - Tracked by service (Required)
- [x] **Category** - Maintenance, Fuel, Accessories, Insurance, Registration, etc (Required)
- [x] **Description** - Details about expense (Required)
- [x] **Total Cost** - Total expense (Required)
- [x] **Payment Method** - Credit, cash, etc
- [x] **Warranty Info / Return Date** - Optional for tracking coverage
- [x] **Quantity** - Number of items bought
- [x] **Attachment** - Image or PDF of the receipt

---

### 📅 **Reminders & Scheduling**

- [x] **Reminder Id** - Unique ID of the reminder (internal)
- [x] **Vehicle Id** - Unique ID of the vehicle (internal)
- [x] **Task Name** - e.g., "Oil Change Reminder"
- [x] **Due Date / Mileage** - Trigger for next service
- [x] **Status** - Pending / Completed / Overdue
