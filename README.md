# 📱 WorkTrack – Worker Attendance & Group Management App

WorkTrack is a **React Native (Expo)** based mobile application designed to manage worker attendance, earnings, and group-based workforce tracking with an admin dashboard.

---

## 🚀 Features

### 👤 Worker (User)

* 🔐 Authentication (Login / Signup)
* 📊 Dashboard with:

  * Monthly earnings
  * Work progress
  * Attendance stats
* 📅 Calendar view with color-coded attendance
* 📝 Daily attendance marking:

  * Day / Night / Half / Absent / Day+Night
* 📩 Receive and manage group invitations

---

### 👨‍💼 Admin

* 🔐 Role-based access control
* 👥 Create and manage groups
* 📩 Send invitations to workers
* 📊 View worker performance (read-only)
* 📅 Track attendance and earnings of each worker
* ❌ Delete groups and remove members

---

## 🧠 Core Logic
* Filters attendance by month
* Counts:

  * Days
  * Nights
  * Half days
  * Absents
* Handles special case:

  * `day_night` → counts as both day and night
* Calculates salary:

```
salary =
(days × daySalary) +
(nights × nightSalary) +
(half × halfDaySalary)
```

---
## 🛠️ Tech Stack

* ⚛️ React Native (Expo)
* 🟦 TypeScript
* 🧭 Expo Router
* ☁️ Appwrite (Auth + Database)

---

## 📸 Screenshots
<img width="250" src="https://github.com/user-attachments/assets/b791cf3a-aafa-4c9d-b025-a179d62de32d" /> <img width="250" src="https://github.com/user-attachments/assets/49c39b03-cf37-45f7-92e7-9a9ada200dea" />  <img width="250" src="https://github.com/user-attachments/assets/81c9b7a1-2705-422c-9bf1-b647dd50a0b6" />




