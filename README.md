# READ ME
**NOTE: Always make a new branch for changes then create a pull request**
\n**NOTE: Do not forget to ask for .env file before performing the commands below**

# SERVER INITIAL SETUP
1. Checkout to the develop branch
```git checkout develop```
2. Install all dependencies
```npm install```
3. Create a postgres database with docker *(MAKE SURE TO INSTALL DOCKER FIRST IN YOUR SYSTEM)*
```npm run create:postgres```
4. Generate prisma
```npm run prisma:generate```
5. Migrate prisma
```npm run prisma:migrate```
