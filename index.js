const Voter = require('./lib/voter');
const debug = require('debug')('express:voter');
const async = require('async');

exports = module.exports = function(options) {

    exports._opts = options ||  {};

    exports._opts.requestUserKey = exports._opts.requestUserKey || 'user';
    exports._opts.onNoVoters = exports._opts.onNoVoters || null;
    exports._opts.onNoUser = exports._opts.onNoUser || null;
    exports._opts.formatError = exports._opts.formatError || function(role, subject, user, voters) {

        const error = new Error('Current user is not granted for subject with role ' + role);
        error.status = 406;

        return error;
    }

    debug('attach voters middleware');

    return function expressVoter(req, res, next) {

        // Add request function
        req.validateVoters = exports.validateVoters.bind(req);

        req.getVotersError = exports.getVotersError.bind(req);

        next();
    }
}

/**
 * Voters array
 */
exports._voters = [];
exports._opts = {};

exports.validateVoters = function validateVoters(role, subject, callback) {

    // Missing callback function
    if (typeof callback !== "function") {
        console.log('warning: next function must be a function in "validVoter(role, subject, next)" function');
        return callback();
    }

    // Find voter for this role and subject
    debug('search voters for role "' + role + '"');
    const voters = Voter.searchVoters(role, subject, exports._voters);
    debug('voters found:', voters.length);

    // No voters found and handleErrorWhenNoVoters is true
    if (!voters.length && exports._opts.onNoVoters) {
        return exports._opts.onNoVoters(callback);
    }

    if (!this[exports._opts.requestUserKey] && exports._opts.onNoUser) {
        return exports._opts.onNoUser(callback);
    }

    // For each voters in series
    return async.map(voters, (voterDefinition, done) => {

        const voter = new Voter(voterDefinition);

        // Validate voter
        voter.validate(role, subject, this[exports._opts.requestUserKey], function(err, valid) {

            voter.error = valid ? null : voter.errorText;

            // Voter validate function error
            if (err) {
                return done(err);
            }

            // Handle error if not valid, else null
            debug(voter.name + ' is valid:', valid);
            return done(null, voter);
        });
    }, (e, voterInstances) => {
        if (e) {
            return callback(e);
        }

        this.voters = voterInstances;

        const votersWithError = this.getVotersError();

        return callback(votersWithError.length ? opts.formatError(role, subject, this[exports._opts.requestUserKey], votersWithError) : null);
    });
};

exports.getVotersError = function getVotersError(voterName) {
    return (this.voters || []).reduce((acc, voter) => {
        if (voter.error && (!voterName || voter.name === voterName)) {
            acc.push({
                error: voter.error,
                voter: voter
            });
        }
        return acc;
    }, []);
}

/**
 * Add a voter to the voters array
 * 
 * @param {object} voter
 * @return {object}
 */
exports.addVoter = function addVoter(voter) {

    voter.name = voter.name || 'voter_' + exports._voters.length;

    Voter.checkVoter(voter);

    exports._voters.push(voter);

    debug('add voter:', voter.name);

    return exports;
}

exports.addVoters = function addVoters(voters) {
    voters.forEach((voter) => exports.addVoter(voter));
}

exports.validate = function(role, subjectGetter) {
    return function(req, res, next) {
        subjectGetter(req, function(err, subject) {
            if (err) {
                return next(err);
            }
            req.validateVoters(role, subject, next);
        });
    }
}