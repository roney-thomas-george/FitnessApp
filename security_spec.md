# Security Specification & Threat Model

## 1. Data Invariants
1. **User Identity & Role Immutability**:
   - A non-admin user cannot change their own `role` or `isActive` status.
   - User document ID must equal `request.auth.uid` during self-profile creation.
   - Admin operations (disabling account, role change, assigning trainer) require verified admin privilege.
2. **Trainer Scope Isolation**:
   - Trainers can only view, assign workouts, and create diet plans for users assigned to them (`trainerId == trainerUid`) or create general templates.
3. **Client Privacy**:
   - Workout logs, food logs, and weight histories are private to the owning user (`userId == request.auth.uid`), their assigned trainer, or an admin.
4. **Validation Strictness**:
   - All document IDs must conform to alphanumeric characters and dashes (`^[a-zA-Z0-9_\-]+$`, size <= 128).
   - Array and string sizes are bound to prevent DoS/wallet exhaustion attacks.

## 2. Dirty Dozen Malicious Payloads Tested
1. **Payload 1 (Privilege Escalation on User Profile)**:
   A standard user sends `{ role: 'admin' }` to their own `/users/{uid}`. Result: REJECTED.
2. **Payload 2 (Disabled User Bypass)**:
   A user with `isActive: false` attempts to write a new food log or workout log. Result: REJECTED.
3. **Payload 3 (Orphaned Workout Log)**:
   A user attempts to log a workout specifying `userId: 'someone_else_id'`. Result: REJECTED.
4. **Payload 4 (Ghost Fields / Shadow Update)**:
   A user updates their weight with extra unrecognized field `{ superuser: true }`. Result: REJECTED.
5. **Payload 5 (Unassigned Trainer Intrusion)**:
   Trainer B attempts to read or mutate diet plans for a client assigned to Trainer A. Result: REJECTED.
6. **Payload 6 (Oversized Payload / Denial of Wallet)**:
   A user logs an exercise with a 2MB instruction string. Result: REJECTED.
7. **Payload 7 (Path Traversal / ID Poisoning)**:
   A malicious request targets `/users/../../../etc/passwd`. Result: REJECTED.
8. **Payload 8 (Admin Self-Promotion via Client)**:
   A normal user creates an entry in `/admins/{uid}` directly. Result: REJECTED.
9. **Payload 9 (Unauthenticated Modification)**:
   Unauthenticated user attempts to read any user profile or log. Result: REJECTED.
10. **Payload 10 (Terminal State / Immutable Field Alteration)**:
    A user attempts to overwrite `createdAt` or change the `userId` of an existing log. Result: REJECTED.
11. **Payload 11 (Blanket Query Scraping)**:
    A client queries `/foodLogs` without filtering by `userId`. Result: REJECTED.
12. **Payload 12 (Email Spoofing)**:
    Unverified email account attempts admin operation. Result: REJECTED.
