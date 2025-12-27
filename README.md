
# PropTrack Pro (Streamlit Edition)

## Setup Instructions
1. **Google Cloud Console**:
   - Create a project.
   - Enable **Google Drive API** and **Google Sheets API**.
   - Create a **Service Account**, download the JSON key, and rename it to `service_account.json`.
   - Place `service_account.json` in this root directory.

2. **Google Sheet**:
   - Create a new Google Sheet named `PropTrack_Pro_DB`.
   - Share the sheet with the email address found in your `service_account.json`.
   - Add tabs: `Houses`, `Tenants`, `Payments`, `LentItems`.
   - Headers for `Houses`: `id, address, rooms, mortgage, bank, status`
   - Headers for `Tenants`: `id, house_id, room_id, name, phone, move_in, total_rent, status`
   - Headers for `Payments`: `id, tenant_id, house_id, method, amount, date, due_month, purposes, status`

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run App**:
   ```bash
   streamlit run app.py
   ```
