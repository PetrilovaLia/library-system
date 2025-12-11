# Library Management System

A full-stack library management application built with Node.js, Express, and PostgreSQL. This project demonstrates CRUD operations, user authentication, and database design for managing books and user borrowing records.

## Features

- **User Authentication**: Register, login, and manage user accounts
- **Book Management**: Add, edit, delete, and search books in the library inventory
- **Borrowing System**: Track borrowed books with borrowing history
- **Search Functionality**: Find books by title, author, or category
- **Responsive Design**: Clean, minimalist interface with custom green color palette
- **Database Integration**: PostgreSQL for reliable data persistence

## Tech Stack

**Backend**
- Node.js
- Express.js
- PostgreSQL

**Frontend**
- HTML5
- CSS3
- Vanilla JavaScript

## Prerequisites

Before running this project, make sure you have installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [PostgreSQL](https://www.postgresql.org/download/) (v12 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository
```bash
git clone https://github.com/PetrilovaLia/library-system.git
cd library-system
```

2. Install dependencies
```bash
npm install
```

3. Set up the database
```bash
# Create a PostgreSQL database
createdb library_db

# Update database configuration in your .env file or config file
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=library_db
# DB_USER=your_username
# DB_PASSWORD=your_password
```

4. Run database migrations (if applicable)
```bash
npm run migrate
```

5. Start the server
```bash
npm start
```

6. Open your browser and navigate to
```
http://localhost:3000
```

## 🔑 Key Learnings

This project helped me develop skills in:
- Building RESTful APIs with Express.js
- Database design and PostgreSQL relationships
- User authentication and session management
- Frontend-backend integration
- CRUD operations and data validation
- Responsive web design principles

## Screenshots

<img width="1872" height="694" alt="obrázok" src="https://github.com/user-attachments/assets/13ede7fe-7752-40cf-8795-72ae8ac71af1" />
<img width="1865" height="615" alt="obrázok" src="https://github.com/user-attachments/assets/0693f701-841d-4872-b435-e0989f8849fa" />
<img width="1872" height="630" alt="obrázok" src="https://github.com/user-attachments/assets/4b8f02d4-3925-4892-8edb-7d2f9650bade" />


## Future Enhancements

- Add book reservation system
- Implement email notifications for overdue books
- Add admin dashboard with statistics
- Include book reviews and ratings
- Mobile app version

## 👤 Author

**Natália Petrilová**
- GitHub: [@PetrilovaLia](https://github.com/PetrilovaLia)
- Email: natalia.petrilova@gmail.com
