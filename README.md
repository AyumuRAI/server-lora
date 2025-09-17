# READ ME

**NOTE: Always make a new branch for changes then create a pull request**
<br>
**NOTE: Do not forget to ask for .env file before performing the commands below**

# SERVER INITIAL SETUP

1. Checkout to the develop branch

```
git checkout develop
```

2. Install all dependencies

```
npm install
```

3. Start the postgres database (MAKE SURE DOCKER IS INSTALLED IN YOUR SYSTEM)

```
npm run start:postgres
```

4. Generate prisma

```
npm run prisma:generate
```

5. Migrate prisma
<p>
<i>Example: npm run prisma:migrate -- init</i>
</p>
<p>
<mark>(Note: Once you have used a migration name, you cannot use the same name again. Each migration must have a unique name. Example: --name second.)</mark>
</p>

```
npm run prisma:migrate -- <name_your_migrate>
```

# ALSO ADD THIS FOR TWILIO SID, AUTH KEY IN .env

```
TWILIO_ACCOUNT_SID="<your-account-sid>"
TWILIO_AUTH_TOKEN="<your-auth-token>"
TWILIO_SERVICE_SID="<your-service-id>"
```

# EXTRAS
1. To stop postgres database server
```
npm run stop:postgres
```

2. To delete the entire postgres database
```
docker-compose down -v
```

3. If you update the schema.prisma, you must run prisma generate and prisma migrate again.
```
npm run prisma:generate
npm run prisma:migrate -- <name_your_migrate>
```