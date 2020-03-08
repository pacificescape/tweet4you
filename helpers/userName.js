module.exports = ({first_name, last_name}) => {

    if (last_name) {
        return (first_name + ` ${last_name}`).trim()
    }

    return first_name
}
