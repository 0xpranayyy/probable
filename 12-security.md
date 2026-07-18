# Security

## Access Keys
Developers authenticate with their API key inside the HTTP `Authorization` headers:
```bash
Authorization: Bearer pk_test_xxxxxx
```

## Anti-Wash Trading (Shield)
To keep markets fair and prevent artificial volume generation, we monitor user actions:
* Trade limits are enforced per IP address and wallet address.
* Algorithms identify cyclic order executions (buying and selling identical shares between linked addresses) and freeze offending wallets automatically.

## Rate Limiting
* Sandbox keys: 60 requests/min.
* Production keys: 1200 requests/min.
