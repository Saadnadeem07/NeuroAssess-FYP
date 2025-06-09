# NeuroAssess Workflow and Database Schema

This document outlines the detailed workflow and database schema for the NeuroAssess application. The application supports children with neurodivergent conditions (dyslexia and dysgraphia) and leverages Supabase for authentication, storage, and real-time messaging.

---
TechStack:
    Frontend:
        - React
        - TypeScript
        - Tailwind CSS
    Backend:
        node js
        express js
        supabase

    Database:
        Supabase




## Updated Detailed Workflow


### 2. Authentication (Managed by Supabase)
- **Sign Up:**  
  - **Supabase Auth Integration:**  
    - Users register via Supabase Auth by providing an email, password, and selecting their account type (User vs. Psychaterist).
  - **Additional Data Storage:**  
    - After authentication, extra details (e.g., account type) are stored in the custom `users` table or in Supabase’s user metadata.
  - **Psychaterist-Specific:**  
    - Psychaterists provide professional details and upload certificates. These are stored in the `psychaterist_profiles` table.
- **Login:**  
  - Users log in using Supabase Auth.
  - Upon successful authentication, the system routes users to their respective dashboards (User, Psychaterist, or Admin).

---

### 3. User Dashboard
- **Overview:**  
  - Displays available features and the user’s current usage status.
- **Modules:**
  1. **Test:**  
     - **Single Test Feature:**  
       - Each user is allowed to take only one test overall.
       - The interface displays a “Start Test” button.
       - After the test is taken, the system marks the test as used.
       - Future ML integration will process and store the test results.
  2. **Learning Plan:**  
     - **Unlimited Levels:**  
       - Users can progress through unlimited levels.
       - **Free Access:** The first 5 levels are free.
       - **Paid Access:** Once the user advances beyond level 5, a monthly payment is required to continue.
       - The dashboard shows the current level and indicates if payment is needed for the next level.
  3. **Messaging & Reports:**  
     - Users can send messages and reports to psychaterists using a real-time messaging interface powered by Supabase.
  4. **Profile Customization:**  
     - Users can update personal details, including profile images.
  5. **Membership & Payment:**  
     - For users advancing past level 5, the system prompts a monthly payment.
     - Payment status and subscription details can be tracked in the `users` table or via an integrated payment service.

---

### 4. Psychaterist Dashboard
- **Overview:**  
  - Provides an overview of pending communication requests and professional profile details.
- **Modules:**
  1. **Profile Customization:**  
     - Psychaterists can update personal details, expertise areas, and professional bios.
     - A dedicated section for uploading certificates or licenses.
  2. **User Communication Requests:**  
     - A list of incoming user requests.
     - Psychaterists can accept or decline requests, initiating a messaging thread upon acceptance.
  3. **Messaging Interface:**  
     - A real-time messaging system (powered by Supabase) for seamless communication with users.

---

### 5. Admin Dashboard
- **Overview:**  
  - A management console for overseeing all user activities and verifying psychaterist credentials.
- **Modules:**
  1. **User Management:**  
     - Admins can view, edit, or delete user accounts.
     - Monitor usage (test taken, current learning plan level) and subscription status.
  2. **Psychaterist Management:**  
     - Review and approve/reject psychaterist accounts based on uploaded certificates and professional details.
  3. **System Monitoring & Logs:**  
     - Audit all system activities with logs stored in a dedicated table.

---

## Updated Database Schema

Below is the database schema, updated to reflect that each user gets one test and the learning plan supports unlimited levels (first 5 levels free, beyond which monthly payment is required).

```markdown
# Tables

## 1. users
| Column Name       | Data Type      | Description                                                         |
|-------------------|----------------|---------------------------------------------------------------------|
| id                | uuid (primary) | Unique identifier from Supabase Auth                                |
| email             | text           | User email address (managed by Supabase)                            |
| name              | text           | Full name                                                           |
| account_type      | text           | 'user', 'psychaterist', or 'admin' (set during sign up)             |
| membership_status | boolean        | True if the user has an active paid subscription                     |
| created_at        | timestamp      | Account creation date                                               |
| updated_at        | timestamp      | Last update timestamp                                               |

## 2. psychaterist_profiles
| Column Name    | Data Type      | Description                                                         |
|----------------|----------------|---------------------------------------------------------------------|
| id             | uuid (primary) | Unique identifier (matches corresponding users.id)                  |
| expertise      | text           | Area(s) of expertise                                                |
| bio            | text           | Professional biography                                              |
| certificate_url| text           | URL for the uploaded certificate/license stored in Supabase Storage |
| is_approved    | boolean        | Approval status set by the admin                                    |
| created_at     | timestamp      | Profile creation date                                               |
| updated_at     | timestamp      | Last update timestamp                                               |

## 3. tests
| Column Name  | Data Type      | Description                                                         |
|--------------|----------------|---------------------------------------------------------------------|
| id           | uuid (primary) | Unique identifier for the test                                      |
| user_id      | uuid           | FK referencing users.id                                             |
| started_at   | timestamp      | When the test was started                                           |
| completed_at | timestamp      | When the test was completed (nullable)                              |
| result_data  | jsonb          | JSON data to store test results (from future ML integration)        |

## 4. learning_plans
| Column Name     | Data Type      | Description                                                         |
|-----------------|----------------|---------------------------------------------------------------------|
| id              | uuid (primary) | Unique identifier for the learning plan                             |
| user_id         | uuid           | FK referencing users.id                                             |
| current_level   | integer        | Current level achieved (starting at 1, unlimited levels)              |
| started_at      | timestamp      | When the learning plan was started                                  |
| updated_at      | timestamp      | Last update timestamp                                               |
| plan_data       | jsonb          | JSON data storing detailed plan information                         |
| payment_required| boolean        | Flag to indicate if payment is required for the next level            |

## 5. messages
| Column Name   | Data Type      | Description                                                         |
|---------------|----------------|---------------------------------------------------------------------|
| id            | uuid (primary) | Unique identifier for the message                                   |
| sender_id     | uuid           | FK referencing users.id (sender)                                    |
| receiver_id   | uuid           | FK referencing users.id (receiver)                                  |
| message_text  | text           | Content of the message                                               |
| sent_at       | timestamp      | Timestamp when the message was sent                                  |
| is_read       | boolean        | Flag for read/unread status                                          |

## 6. admin_logs
| Column Name | Data Type      | Description                                                         |
|-------------|----------------|---------------------------------------------------------------------|
| id          | uuid (primary) | Unique identifier for the log entry                                  |
| admin_id    | uuid           | FK referencing the admin’s user id                                   |
| action      | text           | Description of the performed action                                  |
| target_id   | uuid           | ID of the affected user or psychaterist                              |
| timestamp   | timestamp      | When the action was performed                                        |
| details     | jsonb          | Optional additional details                                          |
