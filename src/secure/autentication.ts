import bcrypt from 'bcryptjs';

function hasPassword(password: string): string {
    const salt = bcrypt.genSaltSync(12);
    return bcrypt.hashSync(password, salt);
}

function checkPassword(password: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(password, hashedPassword);
}

export default {
    hasPassword,
    checkPassword
}