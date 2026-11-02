# PSUT MailBox

A website where PSUT students can send complaints, notes and suggestions to the Student Council, either anonymously or with their name. The council reads and manages everything in an admin portal.

## Run it

Double-click `start.bat`, or run:

```
python server.py
```

- Student site: http://localhost:8000/
- Admin portal: http://localhost:8000/admin

Nothing to install. It needs only Python 3.8 or newer.

## Admin password

The default password is `change-me-now`. Change it before real use by editing the line in `start.bat`, or set the environment variable before you start the server:

```
set PSUT_ADMIN_PASSWORD=YourStrongPassword
python server.py
```

## Letting other devices connect

By default the server only accepts connections from this computer. To let phones and laptops on the same network use it:

```
set PSUT_HOST=0.0.0.0
python server.py
```

Students then open `http://<this-computer's-IP>:8000/`.

## Features

- Three types (Complaint, Note, Suggestion) and 15 categories. Edit the `CATEGORIES` list in `server.py` to change them.
- An Anonymous or "With my name" choice. Anonymous messages store no name, student ID, email or IP address.
- Each message gets a reference number (for example `PSUT-2610-A1B2C3`).
- Admin portal:
  - password login
  - counts by status
  - search, plus filters for category, type, status and anonymous/named
  - a details window for each message
  - status tracking (New, In Review, Resolved, Dismissed)
  - internal notes
  - delete
  - CSV export (opens in Excel)
- Data is stored in `mailbox.db` (SQLite) in this folder. Back up this file to keep your records.

## Files

```
server.py          backend (API + static files + SQLite)
public/index.html  student submission page
public/admin.html  admin portal
public/styles.css  PSUT navy & gold theme
public/app.js      student page logic
public/admin.js    admin portal logic
start.bat          one-click launcher
```
