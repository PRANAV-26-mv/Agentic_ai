# Student Portal Database Exports

This directory contains standalone, portable exports of all portal data.

## Files Overview

1. **`all_portal_data.json`**
   - The master JSON file containing all collections (admins, students, GD sessions, participants, assessments, questions, materials, audit logs).
   - Can be directly loaded into the portal backend or restored via the Admin Dashboard.

2. **`all_portal_data.sql`**
   - Ready-to-run PostgreSQL SQL script.
   - Populates both the active application `portal_storage` table and relational tables (`admins`, `students`, `gd_sessions`, `gd_participants`).
   - Run in any PostgreSQL instance: `psql "<DATABASE_URL>" -f database/exports/all_portal_data.sql`

3. **`students.json`**
   - Contains all 25 enrolled students with IDs, roll numbers, credentials, communities, and levels.

4. **`admins.json`**
   - Contains all portal administrator accounts.

5. **`gd_data.json`**
   - Contains Group Discussion sessions, candidate limits, turn-based speaking orders, and participant records.

6. **`assessments_and_questions.json`**
   - Contains assessments, question banks, and questions.

7. **`study_materials.json`**
   - Contains all published study materials and resources.

## How to Import into PostgreSQL

Run the import script:
```bash
node backend/scripts/import_to_postgres.js "<YOUR_POSTGRES_DATABASE_URL>"
```
Or execute the SQL dump directly:
```bash
psql "<YOUR_POSTGRES_DATABASE_URL>" -f database/exports/all_portal_data.sql
```
