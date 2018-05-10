const Voter = function Voter(config) {

    this.name = config.name;
    this.roles = config.roles;
    this.errorText = config.errorText || 'ACCESS_DENIED';

    this.validate = (...args) => {
        this.role = args[0];
        config.validate.apply(this, args);
    };
};

exports = module.exports = Voter;

exports.checkVoter = function checkVoter(config) {
    if (!config.roles) {
        throw new Error('Missing "roles" array for voter ' + config.name);
    }

    if (!config.supports) {
        throw new Error('Missing "supports" function for voter ' + config.name);
    }

    if (!config.validate) {
        throw new Error('Missing "validate" function for voter ' + config.name);
    }
}

exports.searchVoters = function searchVoters(role, subject, voters) {

    voters = voters ||  [];

    const result = voters.reduce((acc, voter) => {
        if (voter.supports(role, subject || {})) {
            acc.push(voter);
        }
        return acc;
    }, []);

    return result;
}