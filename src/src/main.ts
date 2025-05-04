// Імпортуємо необхідні дані
// @ts-ignore
import { randomUserMock, additionalUsers } from './FE4U-Lab2-mock.mjs';

// Тип для відформатованого користувача
type FormattedUser = {
    id: number;
    favorite: boolean;
    course: string;
    bg_color: string;
    note: string;
    gender: string;
    title: string;
    full_name: string;
    city: string;
    state: string;
    country: string;
    postcode: number;
    coordinates: { latitude: string; longitude: string };
    timezone: { offset: string; description: string };
    email: string;
    b_date: string;
    age: number;
    phone: string;
    picture_large: string;
    picture_thumbnail: string;
};

// Список курсів
const courses = [
    'Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing',
    'Chess', 'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics'
];

// Генерує випадковий елемент з масиву
function getRandomCourse(): string {
    return courses[Math.floor(Math.random() * courses.length)];
}

// Генерує випадковий колір фону
function getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Валідаційні функції
function isCapitalized(str: string): boolean {
    return /^[A-ZА-Я]/.test(str);
}

function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone: string, country: string): boolean {
    // Для прикладу, будемо вважати, що телефон повинен містити тільки цифри і дефіси
    const phoneRegex = /^[0-9\-]+$/;
    return phoneRegex.test(phone);
}

// Функція для перевірки валідності користувача
function validateUser(user: FormattedUser): boolean {
    if (!isCapitalized(user.full_name)) {
        console.error(`Full name is not capitalized: ${user.full_name}`);
        return false;
    }
    if (!isCapitalized(user.gender)) {
        console.error(`Gender is not capitalized: ${user.gender}`);
        return false;
    }
    if (user.note && !isCapitalized(user.note)) {
        console.error(`Note is not capitalized: ${user.note}`);
        return false;
    }
    if (!isCapitalized(user.state)) {
        console.error(`State is not capitalized: ${user.state}`);
        return false;
    }
    if (!isCapitalized(user.city)) {
        console.error(`City is not capitalized: ${user.city}`);
        return false;
    }
    if (!isCapitalized(user.country)) {
        console.error(`Country is not capitalized: ${user.country}`);
        return false;
    }
    if (typeof user.age !== 'number') {
        console.error(`Age is not a number: ${user.age}`);
        return false;
    }
    if (!isValidPhone(user.phone, user.country)) {
        console.error(`Phone format is invalid: ${user.phone}`);
        return false;
    }
    if (!isValidEmail(user.email)) {
        console.error(`Email format is invalid: ${user.email}`);
        return false;
    }
    return true;
}

// Форматування користувачів з додаванням нових полів та валідацією
function formatUsersData(users: any[]): FormattedUser[] {
    let validUserCount = 0; // Лічильник валідних користувачів для присвоєння правильних ID
    return users.map((user) => {
        const formattedUser: FormattedUser = {
            id: 0,  // Тимчасовий id, поки не пройде валідацію
            favorite: false,
            course: getRandomCourse(),
            bg_color: getRandomColor(),
            note: '',
            gender: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '',
            title: user.name?.title || '',
            full_name: `${user.name?.first || ''} ${user.name?.last || ''}`.trim(),
            city: user.location?.city || '',
            state: user.location?.state || '',
            country: user.location?.country || '',
            postcode: typeof user.location?.postcode === 'number' ? user.location.postcode : 0,
            coordinates: {
                latitude: user.location?.coordinates?.latitude || '',
                longitude: user.location?.coordinates?.longitude || ''
            },
            timezone: {
                offset: user.location?.timezone?.offset || '',
                description: user.location?.timezone?.description || ''
            },
            email: user.email || '',
            b_date: user.dob?.date || '',
            age: user.dob?.age || 0,
            phone: user.phone || '',
            picture_large: user.picture?.large || '',
            picture_thumbnail: user.picture?.thumbnail || ''
        };

        // Перевірка валідності користувача
        if (validateUser(formattedUser)) {
            validUserCount++; // Збільшуємо лічильник валідних користувачів
            formattedUser.id = validUserCount; // Присвоюємо id тільки валідним користувачам
            return formattedUser;
        } else {
            console.error(`User is not valid: ${formattedUser.full_name}`);
            return null;  // Якщо користувач не валідний, повертаємо null
        }
    }).filter((user): user is FormattedUser => user !== null);  // Фільтрація невалідних користувачів
}

// Функція для об'єднання та видалення дублікатів
function mergeUsers(userArray1: any[], userArray2: any[]): FormattedUser[] {
    const mergedUsers = [...userArray1, ...userArray2];

    // Видаляємо дублікати на основі email
    const uniqueUsers = mergedUsers.reduce((acc: any[], user) => {
        if (!acc.some(existingUser => existingUser.email === user.email)) {
            acc.push(user);
        }
        return acc;
    }, []);

    return formatUsersData(uniqueUsers);
}

// Функція фільтрації за параметрами (логічне "і")
function filterUsers(
    users: FormattedUser[],
    filters: Partial<Pick<FormattedUser, 'country' | 'age' | 'gender' | 'favorite'>>
): FormattedUser[] {
    return users.filter(user => {
        for (let key in filters) {
            const filterValue = filters[key as keyof typeof filters];
            const userValue = user[key as keyof FormattedUser];

            if (filterValue !== undefined) {
                if (typeof filterValue === 'boolean') {
                    if (userValue !== filterValue) {
                        return false;
                    }
                } else if (typeof filterValue === 'number') {
                    if (userValue !== filterValue) {
                        return false;
                    }
                } else if (typeof filterValue === 'string') {
                    if (String(userValue).toLowerCase() !== filterValue.toLowerCase()) {
                        return false;
                    }
                }
            }
        }
        return true;
    });
}

// Функція сортування користувачів
function sortUsers(
    users: FormattedUser[],
    key: 'full_name' | 'age' | 'b_date' | 'country',
    ascending: boolean = true
): FormattedUser[] {
    return users.sort((a, b) => {
        let valueA: string | number;
        let valueB: string | number;

        switch (key) {
            case 'full_name':
                valueA = a.full_name.toLowerCase();
                valueB = b.full_name.toLowerCase();
                break;
            case 'b_date':
                valueA = new Date(a.b_date).getTime();
                valueB = new Date(b.b_date).getTime();
                break;
            case 'age':
                valueA = a.age;
                valueB = b.age;
                break;
            case 'country':
                valueA = a.country.toLowerCase();
                valueB = b.country.toLowerCase();
                break;
            default:
                return 0;
        }

        if (valueA < valueB) return ascending ? -1 : 1;
        if (valueA > valueB) return ascending ? 1 : -1;
        return 0;
    });
}

// Функція пошуку за критерієм
function searchUsersByCriteria(
    users: FormattedUser[],
    searchField: keyof FormattedUser,   // Поле для пошуку (наприклад, 'age', 'full_name')
    searchValue: string    // Значення для пошуку (наприклад, '>30', 'Norbert')
): FormattedUser[] {
    return users.filter(user => {
        const fieldValue = user[searchField];

        // Якщо поле числове
        if (typeof fieldValue === 'number') {
            const match = searchValue.match(/^([<>]=?|==?)\s*(\d+)$/);
            if (match) {
                const operator = match[1]; // Оператор (<, >, =, <=, >=)
                const value = parseInt(match[2]); // Значення

                switch (operator) {
                    case '>':
                        return fieldValue > value;
                    case '<':
                        return fieldValue < value;
                    case '=':
                    case '==':
                        return fieldValue === value;
                    case '>=':
                        return fieldValue >= value;
                    case '<=':
                        return fieldValue <= value;
                    default:
                        return false;
                }
            } else {
                return false;
            }
        }

        // Якщо поле текстове
        if (typeof fieldValue === 'string') {
            return fieldValue.toLowerCase().includes(searchValue.toLowerCase());
        }

        return false;
    });
}

// Функція розрахунку відсотка відповідності
function calculateMatchingPercentage(
    users: FormattedUser[],    // Масив користувачів
    searchField: keyof FormattedUser,  // Поле для пошуку
    searchValue: string             // Значення для пошуку
): number {
    const matchingUsers = searchUsersByCriteria(users, searchField, searchValue);

    const percentage = (matchingUsers.length / users.length) * 100;
    return percentage;
}

// Приклад використання функцій

// Об'єднання та форматування користувачів
const formattedUsers = mergeUsers(randomUserMock, additionalUsers);
console.log('Відформатовані користувачі:', formattedUsers);
console.log(formattedUsers);
// Завдання 3: Фільтрація користувачів за параметрами
console.log('Фільтрація користувачів за країною "Germany" та статтю "Male":');
const filteredUsers = filterUsers(formattedUsers, { country: 'Germany', gender: 'Male' });
console.log(filteredUsers);

// Завдання 4: Сортування користувачів за віком (спадання)
//console.log('Сортування користувачів за віком (спадання):');
//const sortedUsersByAge = sortUsers(formattedUsers, 'age', false);
//console.log(sortedUsersByAge);

// Завдання 5: Пошук користувачів за іменем "Norbert"
//console.log("Пошук користувачів за іменем 'Norbert':");
//const usersNamedNorbert = searchUsersByCriteria(formattedUsers, 'full_name', 'Norbert');
//console.log(usersNamedNorbert);

// Завдання 6: Розрахунок відсотка користувачів старших за 30 років
const percentageOver30 = calculateMatchingPercentage(formattedUsers, 'age', '>30');
console.log(`Відсоток користувачів старших за 30: ${percentageOver30.toFixed(2)}%`);


// Розрахунок відсотка користувачів з ім'ям "Norbert"
//const percentageNamedNorbert = calculateMatchingPercentage(formattedUsers, 'full_name', 'Norbert');

//console.log(`Відсоток користувачів з ім'ям "Norbert": ${percentageNamedNorbert.toFixed(2)}%`);
