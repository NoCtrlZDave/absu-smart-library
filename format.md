I analyzed the cataloguing worksheet and converted the visible information into structured library metadata. Some handwritten fields are blank, so I have clearly marked them rather than guessing.

## 1. Extracted bibliographic information

| Field                      | Extracted information                        | Confidence  |
| -------------------------- | -------------------------------------------- | ----------- |
| **Institution**            | Abia State University, Uturu                 | High        |
| **Document type**          | Cataloguing Worksheet                        | High        |
| **Main Entry / Author**    | **Toledo, Romeo T.**                         | High        |
| **Title**                  | **Fundamentals of Food Process Engineering** | High        |
| **Edition**                | **2nd edition**                              | High        |
| **Place of publication**   | **New Delhi**                                | High        |
| **Publisher**              | **CBS Publishers**                           | High        |
| **Year of publication**    | **2000**                                     | High        |
| **Physical description**   | **xiii, 566 p.; ill.; 21 cm**                | Medium/High |
| **Additional notes**       | **Includes appendix and index**              | High        |
| **ISBN**                   | **978-81-239-1551-7**                        | High        |
| **Copy status**            | **PBK**                                      | High        |
| **Number of copies**       | **1**                                        | High        |
| **CIP**                    | Not entered / blank                          | High        |
| **Original cataloguing**   | ✓                                            | High        |
| **Call number**            | Not entered / blank                          | High        |
| **Accession number**       | Not entered / blank                          | High        |
| **Tracings**               | Blank                                        | High        |
| **Cross references / USE** | Blank                                        | High        |
| **Catalogued by**          | **Asongye Divine-Favour Oluebube**           | Medium      |
| **Cataloguing date**       | **11-12-2025**                               | High        |
| **Checked by**             | Blank                                        | High        |
| **Checked date**           | Blank                                        | High        |

### Normalized bibliographic record

**Toledo, Romeo T.** *Fundamentals of Food Process Engineering*. 2nd ed. New Delhi: CBS Publishers, 2000. xiii, 566 p. : ill. ; 21 cm. Includes appendix and index. ISBN 978-81-239-1551-7. Paperback. 1 copy.

---

# 2. What this means for the Smart Library website

For the senior stack developer, I would **not simply store the worksheet as an image**. The system should convert cataloguing information into searchable structured data.

A book record could have a structure similar to:

```json
{
  "author": {
    "name": "Toledo, Romeo T."
  },
  "title": "Fundamentals of Food Process Engineering",
  "edition": "2nd edition",
  "publication": {
    "place": "New Delhi",
    "publisher": "CBS Publishers",
    "year": 2000
  },
  "physicalDescription": {
    "pages": "xiii, 566",
    "illustrated": true,
    "size": "21 cm"
  },
  "notes": [
    "Includes appendix and index"
  ],
  "isbn": "978-81-239-1551-7",
  "format": "Paperback",
  "copies": 1,
  "callNumber": null,
  "accessionNumber": null,
  "cataloguedBy": "Asongye Divine-Favour Oluebube",
  "cataloguedDate": "2025-12-11",
  "checkedBy": null,
  "checkedDate": null
}
```

## 3. Recommended database structure

For a serious library system, I recommend separating **bibliographic information** from **physical copies**.

### `books`

```text
id
title
subtitle
edition
isbn
publication_place
publisher
publication_year
physical_description
notes
format
cover_image
created_at
updated_at
```

### `authors`

```text
id
name
```

### `book_authors`

```text
book_id
author_id
```

This allows one book to have multiple authors.

### `copies`

```text
id
book_id
accession_number
call_number
copy_number
status
location
shelf
availability
```

This is important because the worksheet says **1 copy**, but a library may eventually have 5, 10 or 50 copies of the same title.

For example:

```text
Fundamentals of Food Process Engineering
        |
        ├── Copy 1 → Available
        ├── Copy 2 → Borrowed
        └── Copy 3 → Reserved
```

---

# 4. Important fields the Smart Library should support

The physical worksheet reveals several fields that should become part of the digital system.

### Bibliographic fields

**Title**

**Author**

**Edition**

**Publisher**

**Publication location**

**Publication year**

**ISBN**

**Physical description**

**Notes**

**Format**

### Inventory fields

**Number of copies**

**Accession number**

**Call number**

**Copy number**

**Shelf/location**

**Availability status**

### Cataloguing fields

**Catalogued by**

**Cataloguing date**

**Checked by**

**Checked date**

**Original cataloguing**

**CIP**

**Tracings**

**Cross references**

---

# 5. Search functionality

This information also tells us what the Smart Library's search engine should index.

A student should be able to search:

> `Food Process Engineering`

and receive:

**Fundamentals of Food Process Engineering**
Romeo T. Toledo
2nd Edition · CBS Publishers · 2000
ISBN: 978-81-239-1551-7
**Available: 1 copy**

They should also be able to search by:

* Author
* Title
* ISBN
* Publisher
* Subject
* Publication year
* Call number
* Accession number
* Department
* Book availability

---

# 6. Additional metadata the current worksheet does NOT provide

The developer should **not invent these values from the image**. They should be added through the library administration interface when available:

```text
Subject
Classification / DDC
Call Number
Accession Number
Shelf Location
Department
Keywords
Book Cover
Availability
Borrowing Status
Due Date
Loan History
Barcode / QR Code
```

For example, the system could eventually display:

> **Fundamentals of Food Process Engineering**
> Toledo, Romeo T.
> 2nd ed., New Delhi: CBS Publishers, 2000
> ISBN: 978-81-239-1551-7
>
> **Location:** Engineering Library
> **Shelf:** Food Engineering
> **Copies:** 1
> **Status:** Available

---

## 7. Key recommendation for the senior stack developer

The most important architectural point is this:

**Treat the cataloguing worksheet as the source document, but don't make the image the database record.**

The workflow should be:

**Physical cataloguing worksheet → Data extraction → Validation → Digital bibliographic record → Inventory/copy record → Search index → Student-facing library interface**

And because this is intended to be a **smart library**, the system can later support OCR so librarians can photograph/upload a cataloguing worksheet and the system automatically extracts fields such as **author, title, ISBN, publisher, edition and year**, while requiring a librarian to verify uncertain handwriting before saving.

This particular image is a good example of why **human verification should remain in the workflow**: fields such as the cataloguer's handwritten name and physical-description notation are less certain than the printed/formatted bibliographic data.
