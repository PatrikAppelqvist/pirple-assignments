# NodeJS Masterclass Assignment 1

This project is a small node api with one simple route for displaying a welcome message. 

For this course I have created a small library for creating JSON apis which can be found in **lib/createServer**. It's a work in progress but was enough for this simple project.

# Installation

- Clone project
- Start server by running npm start

# Api

```
POST /hello
{
    "name": "Patrik"
}

Returns:
{
    "message": "Hello Patrik"
}
```