# Electronic Logbook System

A modern, full-stack electronic logbook platform for students and supervisors. Built with React, TypeScript, Node.js, and Supabase.

---

## Features

- **Role-based dashboards** for students, school supervisors, industry supervisors, and admins
- **Logbook entry submission** and review workflow
- **Real-time statistics** and recent activity feeds
- **Responsive UI** with Tailwind CSS
- **Authentication** and secure access control (via Supabase)

---

## Project Structure

```
electronic-logbook/
├── client/      # React frontend (TypeScript) 
├── shared/      # Shared types and utilities
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)
- [Supabase](https://supabase.com/) account and project

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Marktech2002/elogbook-project-yaqub-tawab-olamilekan.git
cd electronic-logbook
```

### 2. Install Dependencies


```bash
npm install
```

### 3. Configure Environment Variables

- Copy `.env.example` to `.env` in both `server` and `client` folders.
- Update Supabase credentials, API URLs, and secrets as needed.

### 4. Supabase + Cloudinary Setupn

- Create a project on [Supabase](https://supabase.com/).
- Set up your database tables and authentication as required by the project.
- Update your `.env` files with your Supabase project URL and anon/public keys.
- Update your `.env` files with your cloudinary keys


### 5. Start the Development Servers

#### Frontend + Backend

Open a new terminal window:

```bash
npm run dev
```

- The codebase will typically run at [http://localhost:5173](http://localhost:5173)
---

## Usage

- Register as a student or supervisor.
- Students can submit daily logbook entries.
- Supervisors can review, approve, or reject entries.
- View statistics, recent activities, and reports from the dashboard.

---

## Scripts

| Command         | Location   | Description                  |
|-----------------|------------|------------------------------|
| `npm run dev`   | client/    | Start React frontend         |
| `npm run build` | client/    | Build frontend for prod      |


---

## Technologies Used

- React, TypeScript, Tailwind CSS
- Node.js, Express
- Supabase (database & authentication)
- Lucide Icons, date-fns, and more
- Cloudinary (Files upload)

---

## License

MIT

---

## Contact

For support or contributions, please open an issue or contact the maintainer.