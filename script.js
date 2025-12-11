// glob. premnne
let books = [];
let readers = [];
let borrows = [];

// null vytvaram / inak edit
let editingBookId = null;
let editingReaderId = null;

// server
const API_URL = 'http://localhost:3000/api';

async function loadData() {
    // z postgre
    await loadBooks();
    await loadReaders();
    await loadBorrows();
    updateSelects();
    
    // tabulky
    showBooks();
    showReaders();
    showHistory();
}

// zoznam knih
async function loadBooks() {
    try {
        const response = await fetch(`${API_URL}/books`);
        books = await response.json();
    } catch (error) {
        console.error('Chyba pri načítaní kníh:', error);
    }
}

// citatelia
async function loadReaders() {
    try {
        const response = await fetch(`${API_URL}/readers`);
        readers = await response.json();
    } catch (error) {
        console.error('Chyba pri načítaní čitateľov:', error);
    }
}

// historia vypoziciek
async function loadBorrows() {
    try {
        const response = await fetch(`${API_URL}/borrows`);
        borrows = await response.json();
    } catch (error) {
        console.error('Chyba pri načítaní výpožičiek:', error);
    }
}

// sekcie - prepinanie diviek - ID
function showSection(sectionName) {
    // skry
    document.querySelectorAll('.books_section').forEach(section => {
        section.classList.remove('active');
    });
    
    // odznacenie ci ako je to po nasom
    document.querySelectorAll('.menu_item').forEach(item => {
        item.classList.remove('active');
    });
    
    // ID sekcie, index v sidebare
    const sections = {
        'books': ['sectionBooks', 0],
        'readers': ['sectionReaders', 1],
        'history': ['sectionHistory', 2]
    };
    
    // zvyrazni btn zvolenej sekcie
    const [sectionId, menuIndex] = sections[sectionName];
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.menu_item')[menuIndex].classList.add('active');
}

// popup - kniha

function openAddbookPopup() {
    // nova knizka
    editingBookId = null;
    
    // texty
    document.getElementById('bookPopupTitle').textContent = 'Pridať novú knihu';
    document.getElementById('bookSubmitBtn').textContent = 'Pridať knihu';
    
    // prazdne inputy
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    
    // zobraz popup
    document.getElementById('bookPopup').classList.add('show');
}

// popup - kniha/uprava

function openEditbookPopup(bookId) {
    // kniha z books
    const book = books.find(b => b.id === bookId);
    if (!book) return; 
    
    // id editovanej knihy
    editingBookId = bookId;
    
    // texty v popupe
    document.getElementById('bookPopupTitle').textContent = 'Upraviť knihu';
    document.getElementById('bookSubmitBtn').textContent = 'Uložiť úpravu';
    
    // vyplni ulozenymi datami na edit
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookAuthor').value = book.author;
    
    document.getElementById('bookPopup').classList.add('show');
}

function closebookPopup() {
    document.getElementById('bookPopup').classList.remove('show');
    
    // zmaz info o uprave
    editingBookId = null;
}

// popup - citatel rovnake ^

function openAddReaderPopup() {
    editingReaderId = null;
    
    document.getElementById('readerModalTitle').textContent = 'Pridať nového čitateľa';
    document.getElementById('readerSubmitBtn').textContent = 'Pridať čitateľa';
    
    document.getElementById('readerName').value = '';
    document.getElementById('readerSurname').value = '';
    document.getElementById('readerIdCard').value = '';
    document.getElementById('readerBirthDate').value = '';
    
    document.getElementById('readerModal').classList.add('show');
}

function openEditReaderPopup(readerId) {
    const reader = readers.find(r => r.id === readerId);
    if (!reader) return;
    
    editingReaderId = readerId;
    
    document.getElementById('readerModalTitle').textContent = 'Upraviť čitateľa';
    document.getElementById('readerSubmitBtn').textContent = 'Uložiť úpravu';
    
    document.getElementById('readerName').value = reader.name;
    document.getElementById('readerSurname').value = reader.surname;
    document.getElementById('readerIdCard').value = reader.idCard;
    document.getElementById('readerBirthDate').value = reader.birthDate;
    
    document.getElementById('readerModal').classList.add('show');
}

function closeReaderPopup() {
    document.getElementById('readerModal').classList.remove('show');
    editingReaderId = null;
}

// popup - pozicanie

function openBorrowPopup() {
    // len dostupne knihy
    updateSelects();
    
    // prazdne inputy
    document.getElementById('borrowBook').value = '';
    document.getElementById('borrowReader').value = '';
    
    // otvor 
    document.getElementById('borrowModal').classList.add('show');
}

function closeBorrowPopup() {
    document.getElementById('borrowModal').classList.remove('show');
}

// pridanie/upravnie knihy

async function addBook() {
    // vlozene data uzivatelom
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    
    // ci su vyplnenen polia - inak upozorni
    if (title === '' || author === '') {
        alert('Vyplň názov aj autora!');
        return;
    }
    
    try {
        // upravujem / pridavam
        if (editingBookId !== null) {
            // PUT na server
            await fetch(`${API_URL}/books/${editingBookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author })
            });
        } else {
            // POST na server
            await fetch(`${API_URL}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author })
            });
        }
        
        // nacita zonam knih
        await loadBooks();
        
        // aktualizuj selecty - pripad pridania
        updateSelects();

        closebookPopup();
        
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

// zoznam knih
function showBooks() {
    const tbody = document.getElementById('booksTableBody');
    const emptyState = document.getElementById('booksEmptyState');
    
    // ak nie su udaje o knihach - "hlaska"
    if (books.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    // HTML pre každú knihu
    let html = '';
    for (let book of books) {
        // kto si pozical knihu
        let borrowerName = '-';
        for (let borrow of borrows) {
            if (borrow.bookId === book.id && !borrow.returnDate) {
                borrowerName = `${borrow.readerName} ${borrow.readerSurname}`;
                break;
            }
        }
        
        // dostupna / pozicana
        const statusBadge = book.available 
            ? '<span class="badge available">Dostupná</span>'
            : '<span class="badge borrowed">Požičaná</span>';
        
        // riadok tabulky
        html += `
            <tr>
                <td><strong>${book.title}</strong></td>
                <td>${book.author}</td>
                <td>${statusBadge}</td>
                <td>${borrowerName}</td>
                <td>
                    <button class="btn-icon" onclick="openEditbookPopup(${book.id})" title="Upraviť">Upraviť</button>
                    <button class="btn-icon delete" onclick="deleteBook(${book.id})" title="Zmazať">Zmazať</button>
                </td>
            </tr>
        `;
    }
    
    // HTML do tabulky
    tbody.innerHTML = html;
}


// mazanie knihy
async function deleteBook(bookId) {
    if (!confirm('Naozaj chceš zmazať túto knihu?')) return;
    
    try {
        // DELETE quest na server
        const response = await fetch(`${API_URL}/books/${bookId}`, {
            method: 'DELETE'
        });
        
        // chyba ak je kniha pozicana
        if (!response.ok) {
            const data = await response.json();
            alert(data.error);
            return;
        }
        
        // nove data
        await loadBooks();
        updateSelects();
        
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

// searchbar
function filterBooks() {
    // co uzivatel pise 
    const search = document.getElementById('searchBooks').value.toLowerCase();
    
    // porovnaj riadky so zadanym textom
    const rows = document.querySelectorAll('#booksTableBody tr');
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        
        // zobraz txt - zvysok skry
        if (text.includes(search)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// pridat / upravit citatela

async function addReader() {
    // validacia - povinne polia
    const name = document.getElementById('readerName').value;
    const surname = document.getElementById('readerSurname').value;
    const idCard = document.getElementById('readerIdCard').value;
    const birthDate = document.getElementById('readerBirthDate').value;
    
    // kontrola
    if (!name || !surname || !idCard || !birthDate) {
        alert('Vyplň všetky polia!');
        return;
    }
    
    // format OP: 2 pismena + 6 cislic
    const idCardPattern = /^[A-Z]{2}[0-9]{6}$/;
    if (!idCardPattern.test(idCard)) {
        alert('Číslo OP musí mať formát: 2 veľké písmená + 6 čísel (napr. AB123456)');
        return;
    }
    
    try {
        if (editingReaderId !== null) {
            // uprava - put quest
            const response = await fetch(`${API_URL}/readers/${editingReaderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, surname, idCard, birthDate })
            });
            
            if (!response.ok) {
                const data = await response.json();
                alert(data.error);
                return;
            }
        } else {
            // pridanie - post
            const response = await fetch(`${API_URL}/readers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, surname, idCard, birthDate })
            });
            
            if (!response.ok) {
                const data = await response.json();
                alert(data.error);
                return;
            }
        }
        
        await loadReaders();
        updateSelects();
        closeReaderPopup();
        
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

// zoznam citatelov - ako knihy

function showReaders() {
    const tbody = document.getElementById('readersTableBody');
    const emptyState = document.getElementById('readersEmptyState');
    
    if (readers.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    let html = '';
    for (let reader of readers) {
        html += `
            <tr>
                <td>${reader.idCard}</td>
                <td>${reader.name}</td>
                <td>${reader.surname}</td>
                <td>${reader.birthDate}</td>
                <td>
                    <button class="btn-icon" onclick="openEditReaderPopup(${reader.id})" title="Upraviť">Upraviť</button>
                    <button class="btn-icon delete" onclick="deleteReader(${reader.id})" title="Zmazať">Zmazať</button>
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
}

// zamazanie citatela

async function deleteReader(readerId) {
    if (!confirm('Naozaj chceš zmazať tohto čitateľa?')) return;
    
    try {
        const response = await fetch(`${API_URL}/readers/${readerId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const data = await response.json();
            alert(data.error);
            return;
        }
        
        await loadReaders();
        updateSelects();
        
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

// searchbar - citatel

function filterReaders() {
    const search = document.getElementById('searchReaders').value.toLowerCase();
    const rows = document.querySelectorAll('#readersTableBody tr');
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    }
}

// update  
function updateSelects() {
    // knihy - len dostupné
    const bookSelect = document.getElementById('borrowBook');
    bookSelect.innerHTML = '<option value="">Vyber knihu</option>';
    
    for (let book of books) {
        if (book.available) {
            bookSelect.innerHTML += `<option value="${book.id}">${book.title}</option>`;
        }
    }
    
    // vsetci citatelia
    const readerSelect = document.getElementById('borrowReader');
    readerSelect.innerHTML = '<option value="">Vyber čitateľa</option>';
    
    for (let reader of readers) {
        readerSelect.innerHTML += `<option value="${reader.id}">${reader.name} ${reader.surname}</option>`;
    }
}

// pozicanie knihy
async function borrowBook() {
    const bookId = document.getElementById('borrowBook').value;
    const readerId = document.getElementById('borrowReader').value;
    
    // kontrola vyberu
    if (!bookId || !readerId) {
        alert('Vyber knihu aj čitateľa!');
        return;
    }
    
    try {
        // post na borrows
        await fetch(`${API_URL}/borrows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                bookId: Number(bookId), 
                readerId: Number(readerId) 
            })
        });
        
        // nove data
        await loadBooks();
        await loadBorrows();
        updateSelects();
        closeBorrowPopup();
        
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

// vratenie knihy
async function returnBook(borrowId) {
    try {
        // put quest - returndate
        await fetch(`${API_URL}/borrows/${borrowId}/return`, {
            method: 'PUT'
        });
        
        await loadBooks();
        await loadBorrows();
        updateSelects();
        
    } catch (error) {
        alert('Chyba: ' + error.message);
    }
}

// historia
// function showHistory() {
//     const tbody = document.getElementById('historyTableBody');
//     const emptyState = document.getElementById('historyEmptyState');
    
//     if (borrows.length === 0) {
//         tbody.innerHTML = '';
//         emptyState.classList.add('show');
//         return;
//     }
    
//     emptyState.classList.remove('show');
    
//     let html = '';
//     for (let borrow of borrows) {
//         // stav
//         const statusBadge = borrow.returnDate
//             ? '<span class="badge returned">Vrátené</span>'
//             : '<span class="badge borrowed">Nevrátené</span>';
        
//         const returnDateText = borrow.returnDate || '-';
        
//         html += `
//             <tr>
//                 <td><strong>${borrow.bookTitle}</strong></td>
//                 <td>${borrow.readerName} ${borrow.readerSurname}</td>
//                 <td>${borrow.borrowDate}</td>
//                 <td>${returnDateText}</td>
//                 <td>
//                     ${statusBadge}
//                     ${!borrow.returnDate ? `<button class="btn-small return" onclick="returnBook(${borrow.id})">VRÁTIŤ</button>` : ''}
//                 </td>
//             </tr>
//         `;
//     }
    
//     tbody.innerHTML = html;
// }
// historia
function showHistory() {
    const tbody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('historyEmptyState');
    
    // prazdna historia - koniec
    if (borrows.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    let html = '';
    for (let borrow of borrows) {
        // stav
        let statusBadge = '';
        
        if (borrow.returnDate) {
            statusBadge = '<span class="badge returned">Vrátené</span>';
        } else if (borrow.isOverdue) {
            statusBadge = `<span class="badge overdue">MEŠKANIE ${Math.abs(borrow.daysRemaining)} dní</span>`;
        } else if (borrow.daysRemaining <= 3) {
            statusBadge = `<span class="badge warning">Ostáva ${borrow.daysRemaining} dní</span>`;
        } else {
            statusBadge = `<span class="badge ok">Ostáva ${borrow.daysRemaining} dní</span>`;
        }
        
        html += `
            <tr class="${borrow.isOverdue ? 'row-overdue' : ''}">
                <td><strong>${borrow.bookTitle}</strong></td>
                <td>${borrow.readerName} ${borrow.readerSurname}</td>
                <td>${borrow.borrowDate}</td>
                <td><strong>${borrow.returnDate || borrow.deadline}</strong></td>
                <td>
                    ${statusBadge}
                    ${!borrow.returnDate ? `<button class="btn-small return" onclick="returnBook(${borrow.id})">VRÁTIŤ</button>` : ''}
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
}

loadData();