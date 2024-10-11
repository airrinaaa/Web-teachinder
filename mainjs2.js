// -------------------- Ініціалізація змінних та констант --------------------
let validUsers = [];
const userFavorites = new Map();
let sortedStatisticsUsers = [];
let statisticsCurrentPage = 1;  // Трек поточної сторінки таблиці статистики
const statisticsRowsPerPage = 10;  // Кількість записів на одну сторінку
const usersPerPage = 10;  // Кількість користувачів, які завантажуються за один раз
let apiCurrentPage = 1; // Сторінка для API запитів

// Predefined courses for teachers
const courses = ['Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing', 'Chess', 'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics'];

// -------------------- Вспоміжні Функції --------------------

// Function to calculate age from birth date
function calculateAge(birthDate) {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Generate a random background color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Generate a unique ID for each user
function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Function to format user data
function formatUser(user) {
    const favorite = Math.random() < 0.5;  // Randomly set as favorite
    userFavorites.set(user.login?.uuid, favorite);  // Store favorite status

    const course = courses[Math.floor(Math.random() * courses.length)];

    return {
        gender: user.gender || '',
        title: user.name?.title || '',
        full_name: `${user.name?.first || ''} ${user.name?.last || ''}`.trim(),
        city: user.location?.city || '',
        state: user.location?.state || '',
        country: user.location?.country || '',
        postcode: user.location?.postcode || '',
        coordinates: user.location?.coordinates || {},
        timezone: user.location?.timezone || {},
        email: user.email || '',
        b_date: user.dob?.date || '',
        age: calculateAge(user.dob?.date) || null,
        phone: user.phone || '',
        picture_large: user.picture?.large || '',
        picture_thumbnail: user.picture?.thumbnail || '',
        id: user.login?.uuid || generateUniqueId(),
        favorite: favorite,
        course: course,
        bg_color: getRandomColor(),
        note: ''
    };
}

// Function to validate users
function validateUsers(users) {
    let validUsersList = [];
    let invalidUsers = [];

    users.forEach(user => {
        const errors = [];

        if (!user.full_name || typeof user.full_name !== 'string') {
            errors.push('Invalid name');
        }

        if (typeof user.age !== 'number' || isNaN(user.age)) {
            errors.push('Invalid age');
        }

        if (errors.length === 0) {
            validUsersList.push(user);
        } else {
            invalidUsers.push(user);
        }
    });

    return { validUsers: validUsersList, invalidUsers };
}

// -------------------- Основні Функції --------------------

// Отримання елементу списку викладачів
const teacherList = document.getElementById('teacher-list');

// Function to create a teacher card for main list
function createTeacherCard(teacher) {
    const teacherCard = document.createElement('div');
    teacherCard.classList.add('teacher-card');
    teacherCard.setAttribute('data-teacher-id', teacher.id);

    let profileContent;
    if (teacher.picture_large) {
        profileContent = `<img class="profile-circle" src="${teacher.picture_large}" alt="${teacher.full_name}">`;
    } else {
        const initials = teacher.full_name.split(' ').map(n => n[0]).join(''); // Отримання ініціалів
        profileContent = `<div class="profile-circle initials">${initials}</div>`;
    }

    teacherCard.innerHTML = `
        <span class="star" data-id="${teacher.id}">${teacher.favorite ? '&#11088;' : '&#9734;'}</span>
        ${profileContent}
        <h3>${teacher.full_name}</h3>
        <div class="subject">${teacher.course}</div>
        <div>${teacher.country}</div>
        <button class="view-details-btn" data-id="${teacher.id}">View Details</button>
    `;

    // Додавання обробника події для зірочки
    const star = teacherCard.querySelector('.star');
    if (star) {
        star.addEventListener('click', () => toggleFavorite(teacher.id));
    }

    return teacherCard;
}

// Function to display teachers in main list
function displayTeachers(teachers) {
    teacherList.innerHTML = '';  // Очищення списку перед додаванням нових викладачів
    teachers.forEach(teacher => {
        const teacherCard = createTeacherCard(teacher);
        teacherList.appendChild(teacherCard);
    });
}

// Function to fetch users from API
async function fetchUsers(page = 1) {
    try {
        const response = await fetch(`https://randomuser.me/api/?results=${usersPerPage}&page=${page}`);
        const data = await response.json();

        // Форматуємо та валідуюємо користувачів
        const formattedUsers = data.results.map(formatUser);
        const validationResult = validateUsers(formattedUsers);

        // Додаємо нових валідних користувачів до списку
        validUsers.push(...validationResult.validUsers);

        // Відправляємо кожного валідованого користувача на сервер через POST-запит
        validationResult.validUsers.forEach(user => {
            // Відправляємо користувача на сервер
            fetch('http://localhost:3001/teachers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user), // Конвертуємо об'єкт у JSON
            })
                .then(response => response.json())
                .then(serverData => {
                    console.log('User successfully saved on server:', serverData);
                })
                .catch((error) => {
                    console.error('Error saving user to server:', error);
                });
        });

        updateTeacherList(false);

        if (data.results.length < usersPerPage) {
            const nextButton = document.getElementById('next-button');
            if (nextButton) {
                nextButton.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

const nextButton = document.getElementById('next-button'); // Оголошуємо змінну nextButton

// Event listener for 'next-button'
nextButton.addEventListener('click', () => {
    apiCurrentPage++;
    fetchUsers(apiCurrentPage);
});

// Event listener for teacher list interactions
teacherList.addEventListener('click', function(event) {
    if (event.target.classList.contains('view-details-btn')) {
        const id = event.target.getAttribute('data-id');
        viewTeacherDetails(id);
    }

    if (event.target.classList.contains('star')) { // Зміна класу на 'star'
        const id = event.target.getAttribute('data-id');
        toggleFavorite(id);
    }
});

// Function to view teacher details
function viewTeacherDetails(id) {
    const teacher = validUsers.find(user => user.id === id);
    openModalWithTeacherDetails(teacher);
}

const ageFilter = document.getElementById('age');
const regionFilter = document.getElementById('region');
const sexFilter = document.getElementById('sex');
const photoFilter = document.querySelector('input[name="photo"]');
const favoritesFilter = document.querySelector('input[name="favorites"]');
const searchBtn = document.querySelector('.search-btn');
const searchBar = document.querySelector('.search-bar');
const clearFiltersBtn = document.querySelector('.clear-filters-btn');

// Add event listeners for filters and search
ageFilter.addEventListener('change', () => updateTeacherList(true));
regionFilter.addEventListener('change', () => updateTeacherList(true));
sexFilter.addEventListener('change', () => updateTeacherList(true));
photoFilter.addEventListener('change', () => updateTeacherList(true));
favoritesFilter.addEventListener('change', () => updateTeacherList(true));
searchBtn.addEventListener('click', () => updateTeacherList(false));
clearFiltersBtn.addEventListener('click', () => clearAllFilters());

searchBar.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        updateTeacherList();
    }
});

let debounceTimeout;
searchBar.addEventListener('input', function() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        updateTeacherList();
    }, 300);
});

// Function to update teacher list based on filters and search
function updateTeacherList(resetPage = false) {
    let filtered = [...validUsers];

    // Фільтрація за віком
    if (ageFilter.value !== 'all') {
        const [minAge, maxAge] = ageFilter.value.split('-').map(Number);
        filtered = filtered.filter(user => user.age >= minAge && user.age <= maxAge);
    }

    // Фільтрація за регіоном
    if (regionFilter.value !== 'all') {
        const regions = {
            europe: ['Germany', 'Denmark', 'Norway', 'France', 'Switzerland', 'Ireland', 'Netherlands', 'Spain', 'Turkey'],
            asia: ['Iran', 'China', 'Japan', 'India', 'Vietnam', 'South Korea', 'Singapore'],
            america: ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina'],
            australia: ['Australia']
        };
        filtered = filtered.filter(user => regions[regionFilter.value].includes(user.country));
    }

    // Фільтрація за статтю
    if (sexFilter.value !== 'all') {
        filtered = filtered.filter(user => user.gender === sexFilter.value);
    }

    // Фільтрація за наявністю фото
    if (photoFilter.checked) {
        filtered = filtered.filter(user => user.picture_large);
    }

    // Фільтрація за улюбленими
    if (favoritesFilter.checked) {
        filtered = filtered.filter(user => user.favorite);
    }

    // Пошук
    const searchQuery = searchBar.value.trim().toLowerCase();
    if (searchQuery) {
        filtered = searchUsersByCriteria(filtered, searchQuery);
    }

    // Оновлення списку викладачів
    if (filtered.length === 0) {
        teacherList.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                <p style="color: red; font-size: 20px">На жаль, таких викладачів немає</p>
            </div>`;
    } else {
        displayTeachers(filtered);
    }

    // Оновлення статистики
    sortedStatisticsUsers = sortUsers([...filtered], statisticsSort.column, statisticsSort.order);
    if (resetPage) {
        statisticsCurrentPage = 1;
    }
    displayStatistics(sortedStatisticsUsers, statisticsCurrentPage);
    setupStatisticsPagination(sortedStatisticsUsers);
    updateStatisticsSortIndicators();

    // Оновлення каруселі
    updateFavoritesCarousel();
}

// Function to sort users based on a field and order
function sortUsers(users, sortBy, order = 'ascending') {
    if (!sortBy) return users; // Якщо sortBy не визначено, повертаємо не відсортований масив

    return users.sort((a, b) => {
        let valueA = a[sortBy];
        let valueB = b[sortBy];

        if (sortBy === 'b_date') {
            valueA = new Date(valueA).getTime();
            valueB = new Date(valueB).getTime();
        }

        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        if (order === 'ascending') {
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
        } else if (order === 'descending') {
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
        } else {
            throw new Error("Order must be 'ascending' or 'descending'");
        }
    });
}

// Function to search users by criteria
function searchUsersByCriteria(users, searchValue) {
    return users.filter(user => {
        const fieldsToSearch = ['full_name', 'note', 'age'];

        return fieldsToSearch.some(field => {
            const fieldValue = user[field];

            // Якщо поле є числовим (наприклад, age)
            if (typeof fieldValue === 'number') {
                const match = searchValue.match(/^([<>]=?|==?)\s*(\d+)$/);
                if (match) {
                    const operator = match[1];
                    const value = parseInt(match[2], 10);
                    switch (operator) {
                        case '>': return fieldValue > value;
                        case '<': return fieldValue < value;
                        case '=':
                        case '==': return fieldValue === value;
                        case '>=': return fieldValue >= value;
                        case '<=': return fieldValue <= value;
                        default: return false;
                    }
                }

                return fieldValue === parseInt(searchValue, 10);
            }

            if (typeof fieldValue === 'string') {
                return fieldValue.toLowerCase().includes(searchValue.toLowerCase());
            }

            return false;
        });
    });
}

// Function to clear all filters
function clearAllFilters() {
    // Скидання всіх фільтрів
    ageFilter.value = 'all';
    regionFilter.value = 'all';
    sexFilter.value = 'all';
    photoFilter.checked = false;
    favoritesFilter.checked = false;
    searchBar.value = '';

    // Оновлення списку викладачів та статистики
    updateTeacherList(true); // Скидаємо сторінку таблиці
}

// Function to open modal with teacher details
function openModalWithTeacherDetails(teacher) {
    if (!teacher) return; // Якщо викладач не знайдений, виходимо

    // Отримуємо елементи модального вікна та деталі викладача
    const modal = document.getElementById('modal');
    const teacherDetails = document.getElementById('teacher-details');

    // Визначаємо контент для профілю викладача
    let profileContent;

    // Перевіряємо наявність фотографії
    if (teacher.picture_large) {
        // Якщо є фотографія, показуємо її
        profileContent = `
            <picture>
                <img src="${teacher.picture_large}" width="200" height="200" alt="${teacher.full_name}">
            </picture>
        `;
    } else {
        // Якщо фото немає, показуємо блок з ініціалами
        const initials = teacher.full_name
            .split(' ')
            .map(name => name[0])
            .join(''); // Отримуємо ініціали з імені та прізвища

        profileContent = `
            <div class="profile-circle">
                <span class="initials">${initials}</span>
            </div>
        `;
    }

    // Відображаємо деталі викладача в модальному вікні
    teacherDetails.innerHTML = `
        <div class="teacher-info">
            <div class="add-top">
                <h2>Teacher</h2>
                <button class="close-btn">x</button>
            </div>
            <div class="teacher-info-body">
                <div class="add-columns">
                    ${profileContent}  <!-- Фото або ініціали викладача -->
                    <span>
                        <h3 class="name">${teacher.full_name}</h3>
                        <label><strong>Course:</strong> <span class="subject">${teacher.course}</span></label>
                        <label class="country"><strong>Country:</strong> ${teacher.country}</label>
                        <label class="email"><strong>Email:</strong> <a href="mailto:${teacher.email}">${teacher.email}</a></label>
                        <label class="phone"><strong>Phone:</strong> ${teacher.phone}</label>
                    </span>
                </div>
                <label><strong>Note:</strong> ${teacher.note || 'N/A'}</label>
                <span class="star" data-id="${teacher.id}" style="font-size: 30px; cursor: pointer;">
                    ${teacher.favorite ? '&#11088;' : '&#9734;'}
                </span>
            </div>
        </div>
    `;

    // Отримуємо елемент зірочки
    const favoriteStar = teacherDetails.querySelector('.star');

    // Додаємо обробник події для натискання на зірочку
    if (favoriteStar) {
        favoriteStar.addEventListener('click', () => {
            // Змінюємо статус "улюбленого" для викладача
            toggleFavorite(teacher.id);

            // Оновлюємо вигляд зірочки залежно від нового статусу
            favoriteStar.innerHTML = teacher.favorite ? '&#11088;' : '&#9734;';

            // Оновлюємо список улюблених викладачів у мапі
            userFavorites.set(teacher.id, teacher.favorite);

            // Оновлюємо список викладачів
            updateTeacherList(false);

            // Закриваємо модальне вікно після зміни
            closeModal();
        });
    }

    // Показуємо модальне вікно
    modal.style.display = 'block';

    // Застосовуємо розмиття до основного контенту, якщо елемент 'blur' існує
    const blurElement = document.getElementById('blur');
    if (blurElement) {
        blurElement.style.filter = 'blur(5px)';
    }
}

// Function to close modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';

    // Remove blur effect if використовується
    const blurElement = document.getElementById('blur');
    if (blurElement) {
        blurElement.style.filter = 'none';
    }
}

// Function to toggle favorite status
function toggleFavorite(id) {
    const teacher = validUsers.find(user => user.id === id);
    if (teacher) {
        teacher.favorite = !teacher.favorite;
        userFavorites.set(teacher.id, teacher.favorite);

        updateTeacherList(false);
        updateFavoritesCarousel();
    }
}

// -------------------- Статистика --------------------

// Initialize statistics table and pagination
// Initialize statistics table and pagination
function initializeStatistics() {
    sortedStatisticsUsers = [...validUsers];  // Копіюємо масив без сортування
    displayStatistics(sortedStatisticsUsers, statisticsCurrentPage);  // Відображаємо першу сторінку таблиці
    setupStatisticsPagination(sortedStatisticsUsers);  // Налаштовуємо пагінацію
}


// Function to display statistics
function displayStatistics(teachers, page) {
    const statisticsTableBody = document.querySelector('#statistics-table tbody');
    statisticsTableBody.innerHTML = '';  // Очищуємо таблицю перед додаванням нових записів

    const start = (page - 1) * statisticsRowsPerPage;
    const end = start + statisticsRowsPerPage;
    const paginatedTeachers = teachers.slice(start, end);  // Відображаємо викладачів для поточної сторінки

    paginatedTeachers.forEach(teacher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teacher.full_name}</td>
            <td>${teacher.course}</td>
            <td>${teacher.age}</td>
            <td>${new Date(teacher.b_date).toLocaleDateString()}</td>
            <td>${teacher.country}</td>
        `;
        statisticsTableBody.appendChild(row);
    });
}

// Function to setup pagination for statistics
function setupStatisticsPagination(teachers) {
    const totalPages = Math.ceil(teachers.length / statisticsRowsPerPage);
    const paginationContainer = document.querySelector('.pagination');

    paginationContainer.innerHTML = '';  // Очищуємо попередню пагінацію

    // Генерація посилань для сторінок
    for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement('a');
        pageLink.textContent = i;
        pageLink.href = `#statistics-header`;
        pageLink.classList.add('page-link');
        if (i === statisticsCurrentPage) {
            pageLink.classList.add('active');
        }

        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            statisticsCurrentPage = i;
            displayStatistics(sortedStatisticsUsers, statisticsCurrentPage);
            setupStatisticsPagination(sortedStatisticsUsers);
        });
        paginationContainer.appendChild(pageLink);
    }
}

let statisticsSort = {
    column: 'full_name', // Встановлюємо дефолтне поле сортування
    order: 'ascending'
};
const statisticsHeader = document.getElementById('statistics-header');

// Function to sort statistics table
function sortStatisticsTable(sortBy) {
    if (statisticsSort.column === sortBy) {
        statisticsSort.order = statisticsSort.order === 'ascending' ? 'descending' : 'ascending';
    } else {
        statisticsSort.column = sortBy;
        statisticsSort.order = 'ascending';
    }

    sortedStatisticsUsers = sortUsers([...validUsers], sortBy, statisticsSort.order);
    statisticsCurrentPage = 1;  // Скидаємо сторінку після сортування
    displayStatistics(sortedStatisticsUsers, statisticsCurrentPage);
    setupStatisticsPagination(sortedStatisticsUsers);
    updateStatisticsSortIndicators();
}

// Function to update sort indicators in the table headers
function updateStatisticsSortIndicators() {
    const statisticsTableHeaders = document.querySelectorAll('#statistics-table th');
    statisticsTableHeaders.forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
        const sortBy = header.getAttribute('data-sort');
        if (sortBy === statisticsSort.column) {
            header.classList.add(statisticsSort.order === 'ascending' ? 'sorted-asc' : 'sorted-desc');
        }
    });
}

// Add event listeners for sorting on table headers
document.querySelectorAll('#statistics-table th').forEach(header => {
    header.addEventListener('click', function () {
        const sortBy = this.getAttribute('data-sort');
        sortStatisticsTable(sortBy);
    });
});

// -------------------- Карусель "Favorites" --------------------

// Параметри каруселі
const favoritesCarouselElement = document.getElementById('favorites-carousel');
const leftArrowButton = document.querySelector('.left-arrow');
const rightArrowButton = document.querySelector('.right-arrow');
const teachersPerPageCarousel = 5; // Кількість викладачів на сторінці каруселі
let currentIndexCarousel = 0;

// Function to create a teacher card for carousel
function createFavoriteTeacherCard(teacher) {
    const teacherCard = document.createElement('div');
    teacherCard.classList.add('teacher-card');
    teacherCard.setAttribute('data-teacher-id', teacher.id);

    let profileImage;
    if (teacher.picture_large) {
        profileImage = `<img src="${teacher.picture_large}" alt="${teacher.full_name}">`;
    } else {
        const initials = teacher.full_name.split(' ').map(n => n[0]).join('');
        profileImage = `<div class="profile-circle initials">${initials}</div>`;
    }

    teacherCard.innerHTML = `
        ${profileImage}
        <h3>${teacher.full_name}</h3>
        <div class="subject">${teacher.course}</div>
        <div>${teacher.country}</div>
        <span class="star" data-id="${teacher.id}">${teacher.favorite ? '&#11088;' : '&#9734;'}</span>
    `;

    // Додавання обробника події для зірочки
    const star = teacherCard.querySelector('.star');
    if (star) {
        star.addEventListener('click', () => toggleFavoriteCarousel(teacher.id));
    }

    return teacherCard;
}

// Function to toggle favorite status from carousel
function toggleFavoriteCarousel(id) {
    const teacher = validUsers.find(user => user.id === id);
    if (teacher) {
        teacher.favorite = !teacher.favorite;
        userFavorites.set(teacher.id, teacher.favorite);

        updateTeacherList(false);
        updateFavoritesCarousel();
    }
}

// Function to update каруселі
function updateFavoritesCarousel() {
    favoritesCarouselElement.innerHTML = ''; // Очищення поточної каруселі

    const favoriteTeachers = validUsers.filter(user => user.favorite);
    const totalTeachers = favoriteTeachers.length;

    if (totalTeachers === 0) {
        favoritesCarouselElement.innerHTML = '<p>Немає улюблених викладачів</p>';
        leftArrowButton.style.display = 'none';
        rightArrowButton.style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(totalTeachers / teachersPerPageCarousel);

    // Обмеження поточної індексації
    if (currentIndexCarousel >= totalTeachers) {
        currentIndexCarousel = Math.max(totalTeachers - teachersPerPageCarousel, 0);
    }

    const teachersToDisplay = favoriteTeachers.slice(currentIndexCarousel, currentIndexCarousel + teachersPerPageCarousel);

    teachersToDisplay.forEach(teacher => {
        const teacherCard = createFavoriteTeacherCard(teacher);
        favoritesCarouselElement.appendChild(teacherCard);
    });

    // Показати або приховати кнопки навігації
    leftArrowButton.style.display = currentIndexCarousel > 0 ? 'block' : 'none';
    rightArrowButton.style.display = (currentIndexCarousel + teachersPerPageCarousel) < totalTeachers ? 'block' : 'none';
}

// Обробники кнопок навігації
leftArrowButton.addEventListener('click', () => {
    currentIndexCarousel = Math.max(currentIndexCarousel - teachersPerPageCarousel, 0);
    updateFavoritesCarousel();
});

rightArrowButton.addEventListener('click', () => {
    const favoriteTeachers = validUsers.filter(user => user.favorite);
    const totalTeachers = favoriteTeachers.length;
    currentIndexCarousel = Math.min(currentIndexCarousel + teachersPerPageCarousel, totalTeachers - teachersPerPageCarousel);
    updateFavoritesCarousel();
});

// Function to initialize карусель
function initializeFavoritesCarousel() {
    updateFavoritesCarousel();
}

// -------------------- Додавання Нового Викладача --------------------

// Function to add a new teacher
// Function to add a new teacher
// Function to validate new teacher data
function validateTeacherData(teacher) {
    const errors = [];

    // Валідація імені
    if (!teacher.full_name || typeof teacher.full_name !== 'string' || teacher.full_name.trim() === '') {
        errors.push('Invalid full name');
    }

    // Валідація віку
    if (typeof teacher.age !== 'number' || isNaN(teacher.age) || teacher.age <= 0) {
        errors.push('Invalid age');
    }

    // Валідація email
    if (!teacher.email || !/\S+@\S+\.\S+/.test(teacher.email)) {
        errors.push('Invalid email');
    }

    // Валідація телефону (як приклад, можна змінити на потрібний формат)
    if (!teacher.phone || !/^[0-9]+$/.test(teacher.phone)) {
        errors.push('Invalid phone number');
    }

    return errors;
}

// Function to add a new teacher
function addNewTeacher(teacherData) {
    const newTeacher = {
        gender: teacherData.gender,
        title: '',
        full_name: teacherData.full_name,
        city: teacherData.city || '',
        state: teacherData.state || '',
        country: teacherData.country,
        postcode: '',
        coordinates: {
            latitude: '',
            longitude: ''
        },
        timezone: {
            offset: '',
            description: ''
        },
        email: teacherData.email,
        b_date: teacherData.dob || '',
        age: calculateAge(teacherData.dob),
        phone: teacherData.phone,
        picture_large: teacherData.picture_large || '',
        picture_thumbnail: teacherData.picture_large ? teacherData.picture_large.replace('large', 'thumbnail') : '',
        id: generateUniqueId(),
        favorite: false,
        course: teacherData.course,
        bg_color: getRandomColor(),
        note: teacherData.note || ''
    };

    // Перевіряємо, чи пройшов викладач валідацію
    const validationErrors = validateTeacherData(newTeacher);

    if (validationErrors.length > 0) {
        // Якщо є помилки валідації, виводимо їх у консоль або на екран
        console.error('Validation errors:', validationErrors);
        alert(`Validation failed: ${validationErrors.join(', ')}`);
        return; // Якщо валідація не пройшла, не додаємо викладача
    }

    // Відправляємо новий викладач на сервер через POST запит
    fetch('http://localhost:3001/teachers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTeacher)
    })
        .then(response => response.json())
        .then(savedTeacher => {
            console.log('Teacher successfully saved to server:', savedTeacher);
            validUsers.push(savedTeacher);  // Додаємо викладача до списку
            userFavorites.set(savedTeacher.id, savedTeacher.favorite); // Оновлюємо мапу улюблених

            // Додаємо викладача до UI
            const teacherCard = createTeacherCard(savedTeacher);
            teacherList.appendChild(teacherCard);

            // Оновлюємо статистику та карусель
            initializeStatistics();
            updateFavoritesCarousel();
        })
        .catch(error => {
            console.error('Error saving teacher to server:', error);
        });

    // Закриття модального вікна та скидання форми
    const addTeacherModal = document.getElementById('add-teacher-modal');
    addTeacherModal.style.display = 'none';
    const addTeacherForm = document.getElementById('add-teacher-form');
    addTeacherForm.reset();
}


// -------------------- Ініціалізація При Завантаженні Сторінки --------------------

// Initialize statistics and carousel on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchUsers(apiCurrentPage).then(() => {
        initializeStatistics();
        initializeFavoritesCarousel(); // Ініціалізуємо карусель після завантаження користувачів
    });

    // Додавання обробників подій для кнопки "Add Teacher" та форми
    const addTeacherButton = document.getElementById('add-teacher-button');
    const addTeacherModal = document.getElementById('add-teacher-modal');
    const addTeacherForm = document.getElementById('add-teacher-form');

    // Відкриття модального вікна при натисканні кнопки "Add Teacher"
    addTeacherButton.addEventListener('click', () => {
        addTeacherModal.style.display = 'block';
    });

    // Закриття модального вікна при натисканні на кнопку закриття
    addTeacherModal.querySelector('.close-btn').addEventListener('click', () => {
        addTeacherModal.style.display = 'none';
    });

    // Закриття модального вікна при натисканні поза його межами
    window.addEventListener('click', (event) => {
        if (event.target === addTeacherModal) {
            addTeacherModal.style.display = 'none';
        }
    });

    // Обробник події для форми додавання викладача
    addTeacherForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Запобігаємо перезавантаженню сторінки

        // Збираємо дані з форми
        const formData = new FormData(addTeacherForm);
        const teacherData = {
            gender: formData.get('gender'),
            full_name: formData.get('full_name'),
            dob: formData.get('dob'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            country: formData.get('country'),
            course: formData.get('course'),
            picture_large: formData.get('picture_large'),
            note: formData.get('note'),
        };

        // Викликаємо функцію додавання нового викладача
        addNewTeacher(teacherData);

        // Закриваємо модальне вікно
        addTeacherModal.style.display = 'none';

        // Скидаємо форму
        addTeacherForm.reset();
    });
});

// -------------------- Обробка Закриття Модальних Вікон --------------------

// Function to handle closing modals
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('close-btn')) {
        closeModal();
    }
});

document.getElementById('statistics-header').addEventListener('click', () => {
    resetSorting(); // Функція, яка скидає сортування таблиці статистики
});

// Функція для скидання сортування
function resetSorting() {
    statisticsSort = { column: null, order: null};
    sortedStatisticsUsers = sortUsers([...validUsers], statisticsSort.column, statisticsSort.order);
    statisticsCurrentPage = 1;
    displayStatistics(sortedStatisticsUsers, statisticsCurrentPage);
    setupStatisticsPagination(sortedStatisticsUsers);
    updateStatisticsSortIndicators();
}
