# Express-voter

## Instal

```bash
npm i --save express-voter
```

## How to use

Before use validation from request or from middleware, you have to implement your system user management, for example with `passport`.

1. Add voters
```js
// app.js

// Require module
const expressVoter = require('express-voter');

// ...

// Add voter
expressVoter.addVoter({
    roles: ['view', 'edit'],
    supports: function(role, subject) {

        // Check if role is in voter roles
        if (!this.roles.find((r) => r.toLowerCase() === role.toLowerCase())) {
            return false;
        }

        // Do other check, if subject instance of SomeThing for example
        // ...

        return true;
    },
    validate: function(role, subject, user, callback) {
        // Validate by role
        switch(role){
            case this.roles[0]:

                // ... 

                // Validation OK
                return callback(null, true);
        }
        callback(new Error('this code should not be reached'));
    }
});

/*
// Or
expressVoter.addVoters([
    {
        "name": "voter_A"
        //...
    },{
        "name": "voter_B"
        // ...
    }
]);
*/

// Apply middleware
app.use(expressVoter());
```

2. a) Handle validation from request

```js
app.get('/:subjectId', function(req, res, next){

    // Get subject from "subjectId" parameter
    const subject = {};

    req.validateVoters('view', subject, function(err){
        if(err){
            // One or more voters are not valid
            return next(err);
        }

        // Go on
        // ...
    })
});
```

2. b) Handle validation from middleware

```js

const subjectGetter = function(req, callback){

    // Get subject from "subjectId" parameter
    const subject = {};

    callback(null, subject);
}

app.get('/:subject', expressVoter.validate('view', subjectGetter), function(req, res, next){

    // Go on
    // ...

});
```

## Voter configuration


| Key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| name| string | no | 'voter_${index}' | The voter name |
| roles | array\<string\> | yes |  | An array of roles for the voter |
| supports | function | yes |  | The supports function to know if the voter supports role and subject. Must return true if role and subject are supported by the voter. Pass two arguments, the role and the subject to check |
| validate | function | yes |  | The validate function to know if the current user is granted. This function is called if the supports function return true. Voter pass the validation function if you call callback like "callback(null, true)". Pass four arguments: role, subject, the current user and the callback function |
| errorText | string | no | 'ACCESS_DENIED' | The voter error text when not valid |

## Global configuration

```js
app.use(expressVoter({
    // ...
    requestUserKey: 'user'
}));
```

| Key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| onNoVoters | function | no |  | A function to handle on no voters found |
| onNoUser | function | no |  | A function to handle on user is not found from "request.${requestUserKey}" |
| formatError | function | no | function(){...} | A function to format error on voters not valid |
| requestUserKey | string | no | 'user' | The request user key to find current user |
