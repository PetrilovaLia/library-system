const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// domena / questy / subory
app.use(cors());
app.use(express.json());
app.use(express.static('.'));


// pripojenie
const pool = new Pool({
    user: 'postgres',         
    host: 'localhost',
    database: 'kniznica',
    password: 'admin',   
    port: 5433,
});

// debug - pripojenie
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Chyba pripojenia k SQL:', err);
    } else {
        console.log('Pripojenie k PostgreSQL úspešné');
    }
});


// APIcko - knihy
// SELECT * FROM books
app.get('/api/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// insert - def nevypozicana
app.post('/api/books', async (req, res) => {
    try {
        const { title, author } = req.body;
        const result = await pool.query(
            'INSERT INTO books (title, author, available) VALUES ($1, $2, TRUE) RETURNING *',
            [title, author]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// update 
app.put('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author } = req.body;
        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2 WHERE id = $3 RETURNING *',
            [title, author, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// delete 
app.delete('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // ci nie je pozicana
        const borrowed = await pool.query(
            'SELECT * FROM borrows WHERE bookId = $1 AND returnDate IS NULL',
            [id]
        );
        
        if (borrowed.rows.length > 0) {
            return res.status(400).json({ error: 'Nemôžeš zmazať vypožičanú knihu!' });
        }
        
        await pool.query('DELETE FROM books WHERE id = $1', [id]);
        res.json({ message: 'Kniha zmazaná' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// API citatelia
// *
app.get('/api/readers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM readers ORDER BY id');
        // birthDate - string a mena stlpcov - camelCase
        const readers = result.rows.map(r => ({
            id: r.id,
            name: r.name,
            surname: r.surname,
            idCard: r.idcard,
            birthDate: r.birthdate.toISOString().split('T')[0]
        }));
        res.json(readers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// novy citatel - add
app.post('/api/readers', async (req, res) => {
    try {
        const { name, surname, idCard, birthDate } = req.body;
        // kontrola formatu
        const idCardPattern = /^[A-Z]{2}[0-9]{6}$/;
        if (!idCardPattern.test(idCard)) {
            return res.status(400).json({ 
                error: 'Číslo OP musí mať formát: 2 veľké písmená + 6 čísel (napr. AB123456)' 
            });
        }
        const result = await pool.query(
            'INSERT INTO readers (name, surname, idCard, birthDate) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, surname, idCard, birthDate]
        );
        const reader = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            surname: result.rows[0].surname,
            idCard: result.rows[0].idcard,
            birthDate: result.rows[0].birthdate.toISOString().split('T')[0]
        };
        res.json(reader);
    } catch (error) {
        if (error.code === '23505') { // unique constraint 
            res.status(400).json({ error: 'Čitateľ s týmto číslom OP už existuje!' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// edit
app.put('/api/readers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, surname, idCard, birthDate } = req.body;
        // id op valid
        const idCardPattern = /^[A-Z]{2}[0-9]{6}$/;
        if (!idCardPattern.test(idCard)) {
            return res.status(400).json({ 
                error: 'Číslo OP musí mať formát: 2 veľké písmená + 6 čísel (napr. AB123456)' 
            });
        }
        const result = await pool.query(
            'UPDATE readers SET name = $1, surname = $2, idCard = $3, birthDate = $4 WHERE id = $5 RETURNING *',
            [name, surname, idCard, birthDate, id]
        );
        const reader = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            surname: result.rows[0].surname,
            idCard: result.rows[0].idcard,
            birthDate: result.rows[0].birthdate.toISOString().split('T')[0]
        };
        res.json(reader);
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Čitateľ s týmto číslom OP už existuje!' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// delete
app.delete('/api/readers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // ci nema pozicanu knihu in case
        const borrowed = await pool.query(
            'SELECT * FROM borrows WHERE readerId = $1 AND returnDate IS NULL',
            [id]
        );
        
        if (borrowed.rows.length > 0) {
            return res.status(400).json({ error: 'Nemôžeš zmazať čitateľa, ktorý má vypožičané knihy!' });
        }
        
        await pool.query('DELETE FROM readers WHERE id = $1', [id]);
        res.json({ message: 'Čitateľ zmazaný' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// poziciavanie
// * + join
app.get('/api/borrows', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.id,
                b.bookId,
                b.readerId,
                b.borrowDate,
                b.returnDate,
                books.title as bookTitle,
                books.author as bookAuthor,
                readers.name as readerName,
                readers.surname as readerSurname
            FROM borrows b
            JOIN books ON b.bookId = books.id
            JOIN readers ON b.readerId = readers.id
            ORDER BY b.id DESC
        `);
        
        // const borrows = result.rows.map(b => ({
        //     id: b.id,
        //     bookId: b.bookid,
        //     readerId: b.readerid,
        //     borrowDate: b.borrowdate.toLocaleString('sk-SK'),
        //     returnDate: b.returndate ? b.returndate.toLocaleString('sk-SK') : null,
        //     bookTitle: b.booktitle,
        //     bookAuthor: b.bookauthor,
        //     readerName: b.readername,
        //     readerSurname: b.readersurname
        // }));

        // deadline pridany
        const borrows = result.rows.map(b => {
            const borrowDate = new Date(b.borrowdate);

            // uz prevedene zo stringu na objekt
            const deadline = new Date(borrowDate);
            deadline.setDate(deadline.getDate() + 14);
            
            // premenne na vysledky - vratena/nie je oneskorená(zatial - if )
            let daysRemaining = null;
            let isOverdue = false;
            
            // iba ak nie je vratena
            if (!b.returndate) {
                const today = new Date();
                const diffTime = deadline - today;
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                isOverdue = daysRemaining < 0;
            }
            
            // 
            return {
                id: b.id,
                bookId: b.bookid,
                readerId: b.readerid,
                borrowDate: borrowDate.toLocaleDateString('sk-SK'),
                returnDate: b.returndate ? new Date(b.returndate).toLocaleDateString('sk-SK') : null,
                deadline: deadline.toLocaleDateString('sk-SK'), 
                daysRemaining: daysRemaining, 
                isOverdue: isOverdue, 
                bookTitle: b.booktitle,
                bookAuthor: b.bookauthor,
                readerName: b.readername,
                readerSurname: b.readersurname
            };
        });
        res.json(borrows);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// vypozicanie 
app.post('/api/borrows', async (req, res) => {
    try {
        const { bookId, readerId } = req.body;
        const borrowDate = new Date();
        
        // ozn nedostupnosti
        await pool.query('UPDATE books SET available = FALSE WHERE id = $1', [bookId]);
        
        // vypozicaj
        const result = await pool.query(
            'INSERT INTO borrows (bookId, readerId, borrowDate) VALUES ($1, $2, $3) RETURNING *',
            [bookId, readerId, borrowDate]
        );
        
        const borrow = {
            id: result.rows[0].id,
            bookId: result.rows[0].bookid,
            readerId: result.rows[0].readerid,
            borrowDate: result.rows[0].borrowdate.toLocaleString('sk-SK'),
            returnDate: null
        };
        
        res.json(borrow);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// vratenie
app.put('/api/borrows/:id/return', async (req, res) => {
    try {
        const { id } = req.params;
        const returnDate = new Date();
        
        // bookId
        const borrowResult = await pool.query('SELECT bookId FROM borrows WHERE id = $1', [id]);
        const bookId = borrowResult.rows[0].bookid;
        
        // returndate
        await pool.query('UPDATE borrows SET returnDate = $1 WHERE id = $2', [returnDate, id]);
        
        // kniha je opat dostupna - borows aj books
        await pool.query('UPDATE books SET available = TRUE WHERE id = $1', [bookId]);
        
        res.json({ 
            id: parseInt(id), 
            returnDate: returnDate.toLocaleString('sk-SK') 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


const PORT = 3000

app.listen(PORT, () => {
    console.log(`Adresa servera http://localhost:${PORT}`)
})