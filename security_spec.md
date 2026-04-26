# Security Specification - Scholars-Path

## 1. Data Invariants
- A `User` profile must always have a `uid` matching their auth ID.
- `role` must be initially 'free' unless modified by an admin.
- `Scholarships` are publicly readable for broader accessibility.
- `Roadmaps` are private to the creator.
- `matchCount` increments must be tracked to enforce free tier limits.
- `isAdmin` check must use a trusted doc or a specific bootstrapped email.

## 2. The Dirty Dozen (Vulnerability Payloads)

1. **Identity Spoofing**: Attempt to create a user profile for a different UID.
2. **Privilege Escalation**: Attempt to set `role: 'admin'` during self-registration.
3. **Ghost Field Injection**: Attempt to add `isVerified: true` to a profile update.
4. **ID Poisoning**: Injecting massive 1MB string as a document ID.
5. **Unauthorized Roadmap Read**: User A trying to read User B's roadmap.
6. **Bypassing Match Limits**: Attempting to update `matchCount` to a lower value.
7. **Public Profile Scraping**: Trying to list all documents in `/users/`.
8. **Malicious Scholarship Write**: Guest user trying to create/delete a scholarship.
9. **Role Preservation Bypass**: User trying to change their own role during a profile update.
10. **Admin Spoofing**: Attempting to perform admin actions by providing a fake session claim.
11. **Resource Exhaustion**: Sending a massive string in a forum post.
12. **PII Leakage**: Guest user attempting to `get()` a private user profile.

## 3. Test Cases (TDD)
(Refer to `firestore.rules.test.ts` for implementation)
- UNTRUSTED_REGISTRATION: Should reject role: 'admin'.
- UNAUTHORIZED_PROFIL_READ: Non-owner/non-admin should be denied.
- PUBLIC_SCHOLARSHIP_ACCESS: Guest should be allowed.
- GHOST_FIELD_UPDATE: Update with unknown keys should be denied.
- ROLE_MUTATION_DENIAL: User cannot change their own role.

