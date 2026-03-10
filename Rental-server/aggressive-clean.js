const admin = require('firebase-admin');

const pkRaw = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKkwggSjAgEAAoIBAQC15P/3KTnDkDix
qQkc4RbJljoT1iHWz93PxCIPdkL4KVe9/vXZ3lIrbOzBnyFFXPjQ1SLug7RJUZmM
09pThyrpugQwnWiFTuZOpPBY7uRGzgj458tJPdOBky/l6t+VT7qWzfRgvb/73taU
52JO/6HJ7Bk2a2z6I+WY5J3g7wNVzS8mOrYvJ4iHchrw4JQLdDxrVDCAuUrl9EbY
TfwY3uPSF+L5XUJu3Ypl9no4m73x0vvS/pKNP5ME7Ikw0XEuQ9EJJkFXVfGrQVbY
kJopI70Wmr4tJrVKg8kQYTTUSocteQKmiChh8mDC/iA4EEwftGUkkplHWZskH6mz
6oTptOkzAgMBAAECggEAMRyOnA5ugUYMeLOaOUjxHSbJsZdsdZKUYkejpqcYt+Z5
wVv4x4WGjCER38l2c0MCD2is0NeQswcsPWDqHwls5cSK4xFtKik+d9eC6ZA+5Hs2
4vW65qCh3ed+1EZRbgAj8hnTtNcm4fut1nCPE6Nj7KApwo7I0tUkZd68XgJK1Txn
Egwzb5D4dbeqvH1lsN+TpdYYYvaDfoJ5bUiwZ5xxK/W+dH58WSqHdpeaiN0Mn44z
TVT6ZGfS7anBE/6/VU0oNWQlNxgs3CR9Yj3IzLzeoE5PHAQst5w7LBUe2GiUgKOF
Zb2NhfGl05t3j3fEGsL8PizbVklRHipxs8HyO7d5KQKBgQDxJwYJsDg7Srfmjf69
e48hBQhnrbi1u7JQeYvexqx/V4+gkuhPrUhFVkpxOyvmdNiPOwzwyJMXuqNi6wVy
ninE9Q9YZyZanJM6vVVg+gVrmqW8BfLJfUX7kpMxIoLT+/H9iuhPY6GuCITRUPNUc
T5sTOUxss2C3nu2YXYKvqL0TFwKBgQDBF/hPGRBufNv+a7SRL+oiVoQPLZzhp1fL
Z9Pe2L7b+SbfoMpDvCyPc12bD2lPV3AeUyQvU2uMGB4VessXzEfbVTcAX2Ndu7Yu
Lb6ZoEQqpyR7n/Ugzut56+N3jtaMs7OsqmWmtKq80WzQCH44YmfzNp5jgi6v4Rk+
XxsGosHcRQKBgFjXV5IaKZ0uWbHGfiKwcnpnsEEB7xqEm5yqKq1X5BTF3VP6yzsP
S6C/uY0dj37HbUDXMF1Eh2wmhirbCpa4Ch/X7fhyG95X4Q0XE/tzDFoN8adKmSwk
niesSC3B2RDfsLcHha45tka3PLcga4Sgc67SZV150dx0un7mSOaMdNwrhAoGBALnK
KH9i7G6C8OICHAE+ixdzCynXh4WPkGgEhNV801ewiXjOqw81deKo7D4QPBG9XgGv
mbd3mpl3cyrTtao2QkWF3qAbJ+6+eHJCTYxfqncnz3Cr3h4tOmFbWMhmxYUoOw89
/QTD/SwkjYA1S81Q0hgwS4IPdoCAI9vhgo2F+OXJAoGAPCDW+g/oRMuzd0Ci4Dsi
nY9vmO4ZCKay7vTpLt0ZrKveZeLCdw3/MFtUSFvdxQ7PBoCPOb4egT7toyiy+ZKl2
k/L/+95mkOHhWNzYhj6O46ziwoti0DoK0vXKho9+d9uxPDyxcjE+32xiQTruCbrL
5ikGIhxV8yHv997hH3RiqkY=
-----END PRIVATE KEY-----`;

// Remove headers, then all whitespace, then reconstruct
let cleanBase64 = pkRaw
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\\n/g, '') // Remove literal \n
    .replace(/\s/g, ''); // Remove all whitespace ( \n \r \t space )

console.log('Cleaned base64 length:', cleanBase64.length);

const finalPk = `-----BEGIN PRIVATE KEY-----\n${cleanBase64}\n-----END PRIVATE KEY-----\n`;

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "rental-management-system-e74d1",
            clientEmail: "firebase-adminsdk-fbsvc@rental-management-system-e74d1.iam.gserviceaccount.com",
            privateKey: finalPk
        })
    }, 'CLEAN_TEST');
    console.log('✅ Success with Cleaned and Reconstructed Key!');
} catch (e) {
    console.log('❌ Still fails even after aggressive cleaning:', e.message);
}
