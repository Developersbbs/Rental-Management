const admin = require('firebase-admin');

// The exact string the user provided
const pk = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKkwggSjAgEAAoIBAQC15P/3KTnDkDix\nqQkc4RbJljoT1iHWz93PxCIPdkL4KVe9/vXZ3lIrbOzBnyFFXPjQ1SLug7RJUZmM\n09pThyrpugQwnWiFTuZOpPBY7uRGzgj458tJPdOBky/l6t+VT7qWzfRgvb/73taU\n52JO/6HJ7Bk2a2z6I+WY5J3g7wNVzS8mOrYvJ4iHchrw4JQLdDxrVDCAuUrl9EbY\nTfwY3uPSF+L5XUJu3Ypl9no4m73x0vvf/pKNP5ME7Ikw0XEuQ9EJJkFXVfGrQVbY\nkJopI70Wmr4tJrVKg8kQYTTUSocteQKmiChh8mDC/iA4EEwftGUkkplHWZskH6mz\n6oTptOkzAgMBAAECggEAMRyOnA5ugUYMeLOaOUjxHSbJsZdsdZKUYkejpqcYt+Z5\nwVv4x4WGjCER38l2c0MCD2is0NeQswcsPWDqHwls5cSK4xFtKik+d9eC6ZA+5Hs2\n4vW65qCh3ed+1EZRbgAj8hnTtNcm4fut1nCPE6Nj7KApwo7I0tUkZd68XgJK1Txn\nEgwzb5D4dbeqvH1lsN+TpdYYYvaDfoJ5bUiwZ5xxK/W+dH58WSqHdpeaiN0Mn44z\nTVT6ZGfS7anBE/6/VU0oNWQlNxgs3CR9Yj3IzLzeoE5PHAQst5w7LBUe2GiUgKOF\nZb2NhfGl05t3j3fEGsL8PizbVklRHipxs8HyO7d5KQKBgQDxJwYJsDg7Srfmjf69\ne48hBQhnrbi1u7JQeYvexqx/V4+gkuhPrUhFVkpxOyvmdNiPOwzwyJMXuqNi6wVy\ninE9Q9YZyZanJM6vVVg+gVrmqW8BfLJfUX7kpMxIoLT+/H9iuhPY6GuCITRUPNUc\nT5sTOUxss2C3nu2YXYKvqL0TFwKBgQDBF/hPGRBufNv+a7SRL+oiVoQPLZzhp1fL\nZ9Pe2L7b+SbfoMpDvCyPc12bD2lPV3AeUyQvU2uMGB4VessXzEfbVTcAX2Ndu7Yu\nLb6ZoEQqpyR7n/Ugzut56+N3jtaMs7OsqmWmtKq80WzQCH44YmfzNp5jgi6v4Rk+\nXxsGosHcRQKBgFjXV5IaKZ0uWbHGfiKwcnpnsEEB7xqEm5yqKq1X5BTF3VP6yzsP\nS6C/uY0dj37HbUDXMF1Eh2wmhirbCpa4Ch/X7fhyG95X4Q0XE/tzDFoN8adKmSwk\niesSC3B2RDfsLcHha45tka3PLcga4Sgc67SZV150dx0un7mSOaMdNwrhAoGBALnK\nKH9i7G6C8OICHAE+ixdzCynXh4WPkGgEhNV801ewiXjOqw81deKo7D4QPBG9XgGv\nmbd3mpl3cyrTtao2QkWF3qAbJ+6+eHJCTYxfqncnz3Cr3h4tOmFbWMhmxYUoOw89\n/QTD/SwkjYA1S81Q0hgwS4IPdoCAI9vhgo2F+OXJAoGAPCDW+g/oRMuzd0Ci4Dsi\nY9vmO4ZCKay7vTpLt0ZrKveZeLCdw3/MFtUSFvdxQ7PBoCPOb4egT7toyiy+ZKl2\nk/L/+95mkOHhWNzYhj6O46ziwoti0DoK0vXKho9+d9uxPDyxcjE+32xiQTruCbrL\n5ikGIhxV8yHv997hH3RiqkY=\n-----END PRIVATE KEY-----\n";

const normalized = pk.replace(/\\n/g, '\n');

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "rental-management-system-e74d1",
            clientEmail: "firebase-adminsdk-fbsvc@rental-management-system-e74d1.iam.gserviceaccount.com",
            privateKey: normalized
        })
    });
    console.log('✅ Success with hardcoded key!');
} catch (e) {
    console.log('❌ Failure with hardcoded key:', e.message);
    console.log('Normalized PK length:', normalized.length);
    // Let's check the base64 part
    const b64 = normalized.split('\n').filter(line => !line.startsWith('-----')).join('');
    console.log('Base64 length:', b64.length);
    console.log('Base64 length % 4:', b64.length % 4);
}
