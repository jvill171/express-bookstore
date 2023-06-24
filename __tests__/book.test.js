process.env.NODE_ENV = "test"

const request = require("supertest");

const app = require("../app");
const db = require("../db");

// isbn for testing
let test_isbn;

beforeEach(async ()=>{
    let result = await db.query(
        `INSERT INTO books
            (isbn, amazon_url,author,language,pages,publisher,title,year)
        VALUES(
            '1234567890123',
            'https://amazon.com/series-a-books',
            'John',
            'English',
            413,
            'Publishers Imaginary',
            'The New Book!',
            2019)
         RETURNING isbn`);

    test_isbn = result.rows[0].isbn
});

describe("POST /books", ()=>{
    test("Create a new book", async ()=>{
        const response = await request(app)
            .post(`/books`)
            .send({
                isbn:'1456317858',
                amazon_url:'https://amazon.com/classic-books',
                author:'Edward',
                language:'English',
                pages:207,
                publisher:'Publishers Olde',
                title:'The Old Classic!',
                year:2005
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty('isbn');
    });

    test("Prevents creationg book when missing data", async ()=>{
        const response = await request(app)
            .post(`/books`)
            .send({ year:2005 });
        expect(response.statusCode).toBe(400);
    });
});

describe("GET /books", ()=>{
    test("Gets a list of (1) books", async ()=>{
        const response = await request(app)
            .get(`/books`);
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("amazon_url");
        expect(books[0]).toHaveProperty("author");
        expect(books[0]).toHaveProperty("language");
        expect(books[0]).toHaveProperty("pages");
        expect(books[0]).toHaveProperty("publisher");
        expect(books[0]).toHaveProperty("title");
        expect(books[0]).toHaveProperty("year");
    })
})

describe("GET /books/id", ()=>{
    test("Gets 1 specific book", async ()=>{
        const response = await request(app)
            .get(`/books/${test_isbn}`);
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.isbn).toBe(test_isbn);
    });
    test("404 response when a book is not found", async ()=>{
        const response = await request(app)
            .get(`/books/0`);
        expect(response.statusCode).toBe(404);
    });
});

describe("PUT /books/:id", ()=>{
    test("Updates 1 specific book", async ()=>{
        const response = await request(app)
            .put(`/books/${test_isbn}`)
            .send({
                amazon_url:'https://classicbooks.com',
                author:'Edward',
                language:'english',
                pages:207,
                publisher:'Publishers Ye Olde Classics',
                title:'A New Classic!',
                year:2000
            });
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.title).toBe("A New Classic!");
    });

    test("Prevents updating isbn of a book", async ()=>{
        const response = await request(app)
            .put(`/books/${test_isbn}`)
            .send({
                amazon_url:'https://classicbooks.com',
                author:'Edward',
                language:'english',
                pages:207,
                publisher:'Publishers Ye Olde Classics',
                title:'A New Classic!',
                year:2000
            });
        console.log("***********************RECEIVED BOOK", response.body)
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.title).toBe("A New Classic!");
    });

    test("Prevents updating of book given a bad field", async ()=>{
        let r = await request(app).get(`/books/${test_isbn}`)
        console.log(r.body.book)
        const response = await request(app)
            .put(`/books/${test_isbn}`)
            .send({
                isbn:'999999999',
                badField: "NEVER ADD ME!!!",
                amazon_url:'https://classicbooks.com',
                author:'Edward',
                language:'english',
                pages:207,
                publisher:'Publishers Ye Olde Classics',
                title:'The Old Classic!',
                year:2005
            });
        r = await request(app).get(`/books/${test_isbn}`)
        console.log(r.body.book)
        expect(response.statusCode).toBe(400);
    });

    test("404 response if book cannot be found", async()=>{
        // Delete test case book
        await request(app)
            .delete(`/books/${test_isbn}`);
        const response = await request(app)
            .put(`/books/${test_isbn}`)
            .send({
                amazon_url:'https://classicbooks.com',
                author:'Edward',
                language:'english',
                pages:207,
                publisher:'Publishers Ye Olde Classics',
                title:'A New Classic!',
                year:2000
            });
            
        expect(response.statusCode).toBe(404)
    });
});

describe("DELETE /books/:id", ()=>{
    test("Deletes 1 specific book", async()=>{
        const response = await request(app)
            .delete(`/books/${test_isbn}`);
        expect(response.body).toEqual({message: "Book deleted"});
    })
})


afterEach(async ()=>{
    await db.query(`DELETE FROM BOOKS`);
});
afterAll(async ()=>{
    await db.end();
});