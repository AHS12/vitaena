/**
 * The word after a number in Polish, Russian and Ukrainian, which changes with the
 * number's last digits: 2 to 4 take one form ("lata", "года"), 5 and up another ("lat",
 * "лет"), and in Russian and Ukrainian 21, 31 and so on take the form for 1.
 */
export function slavic(count: string, few: string, many: string, one = many): string {
    const number = Number(count.replace(/\D/g, ''))
    const tens = number % 100

    if (tens >= 11 && tens <= 14) {
        return many
    }

    return number % 10 === 1 ? one : number % 10 >= 2 && number % 10 <= 4 ? few : many
}
