// Оголошуємо глобальну змінну для збереження користувачів
let randomUserMock = [];

async function fetchUsers() {
    try {
        const response = await fetch('https://randomuser.me/api/?results=50');
        const data = await response.json();

        // Зберігаємо отримані дані у змінну randomUserMock
        randomUserMock = data.results;

        // Передаємо отриманих користувачів у метод displayTeachers
        displayTeachers(randomUserMock);
    } catch (error) {
        console.error('Помилка при отриманні користувачів:', error);
    }
}

// Додаємо виклик функції для отримання користувачів
fetchUsers();

const courses = [
    'Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing',
    'Chess', 'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics'
];

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

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

const userFavorites = new Map();

function formatUser(user) {
    const favorite = Math.random() < 0.5;
    userFavorites.set(user.login?.uuid, favorite);
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
        age: calculateAge(user.dob?.age) || null,
        phone: user.phone || '',
        picture_large: user.picture?.large || '',
        picture_thumbnail: user.picture?.thumbnail || '',
        id: user.login?.uuid || generateUniqueId(),
        favorite: favorite,
        course: courses[Math.floor(Math.random() * courses.length)],
        bg_color: getRandomColor(),
        note: ''
    };
}

function mergeUsers(randomUserMock, additionalUsers) {
    const formattedRandomUsers = randomUserMock.map(formatUser);

    const allUsers = [...formattedRandomUsers, ...formattedAdditionalUsers];

    const uniqueUsersMap = new Map();

    allUsers.forEach(user => {
        const uniqueKey = user.id;
        if (uniqueKey && !uniqueUsersMap.has(uniqueKey)) {
            uniqueUsersMap.set(uniqueKey, user);
        }
    });

    return Array.from(uniqueUsersMap.values());
}

function isCapitalized(str) {
    return /^[A-ZА-Я]/.test(str);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9\-]+$/;  // Простий формат: тільки цифри та дефіси
    return phoneRegex.test(phone);
}

function validateUsers(users) {
    const validUsers = [];
    const invalidUsers = [];

    users.forEach(user => {
        const errors = [];

        if (typeof user.full_name !== 'string' || user.full_name.trim() === '') {
            errors.push('Full name should be a non-empty string.');
        } else if (!isCapitalized(user.full_name)) {
            errors.push('Full name should start with a capital letter.');
        }

        if (typeof user.gender !== 'string' || (user.gender.toLowerCase() !== 'male' && user.gender.toLowerCase() !== 'female')) {
            errors.push('Gender should be either "male" or "female".');
        }

        if (typeof user.city !== 'string' || user.city.trim() === '') {
            errors.push('City should be a non-empty string.');
        } else if (!isCapitalized(user.city)) {
            errors.push('City should start with a capital letter.');
        }

        if (user.state) {
            if (typeof user.state !== 'string') {
                errors.push('State should be a string.');
            } else if (user.state.trim() !== '' && !isCapitalized(user.state)) {
                errors.push('State should start with a capital letter.');
            }
        }

        if (typeof user.country !== 'string' || user.country.trim() === '') {
            errors.push('Country should be a non-empty string.');
        } else if (!isCapitalized(user.country)) {
            errors.push('Country should start with a capital letter.');
        }

        if (user.note) {
            if (typeof user.note !== 'string') {
                errors.push('Note should be a string.');
            } else if (user.note.trim() !== '' && !isCapitalized(user.note)) {
                errors.push('Note should start with a capital letter.');
            }
        }

        if (typeof user.age !== 'number' || isNaN(user.age)) {
            errors.push('Age should be a valid number.');
        }

        if (!isValidPhone(user.phone)) {
            errors.push('Phone number is not valid.');
        }

        if (!isValidEmail(user.email)) {
            errors.push('Email is not valid.');
        }

        if (errors.length === 0) {
            validUsers.push(user);
        } else {
            user.validationErrors = errors;
            invalidUsers.push(user);
        }
    });

    return { validUsers, invalidUsers };
}

let statisticsSort = {
    column: null,
    order: 'ascending'
};

let statisticsCurrentPage = 1;
const statisticsRowsPerPage = 8;
let sortedStatisticsUsers = [];

const statisticsTableHeaders = document.querySelectorAll('#statistics-table th');
const statisticsPaginationContainer = document.querySelector('.pagination');

function sortStatisticsTable(sortBy) {
    if (statisticsSort.column === sortBy) {
        statisticsSort.order = statisticsSort.order === 'ascending' ? 'descending' : 'ascending';
    } else {
        statisticsSort.column = sortBy;
        statisticsSort.order = 'ascending';
    }

    sortedStatisticsUsers = sortUsers([...validUsers], sortBy, statisticsSort.order);
    statisticsCurrentPage = 1;
    displayStatistics(sortedStatisticsUsers, statisticsCurrentPage);
    setupStatisticsPagination(sortedStatisticsUsers);
    updateStatisticsSortIndicators();
}

function updateStatisticsSortIndicators() {
    statisticsTableHeaders.forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
        const sortBy = header.getAttribute('data-sort');
        if (sortBy === statisticsSort.column) {
            header.classList.add(statisticsSort.order === 'ascending' ? 'sorted-asc' : 'sorted-desc');
        }
    });
}

function sortUsers(users, sortBy, order = 'ascending') {
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

function displayStatistics(teachers, page) {
    const statisticsTableBody = document.querySelector('#statistics-table tbody');
    statisticsTableBody.innerHTML = '';

    const start = (page - 1) * statisticsRowsPerPage;
    const end = start + statisticsRowsPerPage;
    const paginatedTeachers = teachers.slice(start, end);

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

function setupStatisticsPagination(teachers) {
    statisticsPaginationContainer.innerHTML = '';

    const totalPages = Math.ceil(teachers.length / statisticsRowsPerPage);

    if (totalPages >= 1) {
        for (let i = 1; i <= totalPages; i++) {
            const pageLink = document.createElement('a');
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.classList.add('page-link');
            if (i === statisticsCurrentPage) {
                pageLink.classList.add('active');
            }
            pageLink.setAttribute('data-page', i);


            pageLink.addEventListener('click', function(event) {
                event.preventDefault();
                statisticsCurrentPage = i;
                displayStatistics(sortedStatisticsUsers.length ? sortedStatisticsUsers : validUsers, statisticsCurrentPage);
                setupStatisticsPagination(sortedStatisticsUsers.length ? sortedStatisticsUsers : validUsers);
                updateStatisticsSortIndicators();
            });

            statisticsPaginationContainer.appendChild(pageLink);
        }


        if (totalPages > 1) {
            const lastLink = document.createElement('a');
            lastLink.href = '#';
            lastLink.textContent = 'Last';
            lastLink.classList.add('page-link');
            lastLink.setAttribute('data-page', totalPages);

            lastLink.addEventListener('click', function(event) {
                event.preventDefault();
                statisticsCurrentPage = totalPages;
                displayStatistics(sortedStatisticsUsers.length ? sortedStatisticsUsers : validUsers, statisticsCurrentPage);
                setupStatisticsPagination(sortedStatisticsUsers.length ? sortedStatisticsUsers : validUsers);
                updateStatisticsSortIndicators();
            });

            statisticsPaginationContainer.appendChild(lastLink);
        }
    }
}



statisticsPaginationContainer.addEventListener('click', function(event) {
    event.preventDefault();
    if (event.target.classList.contains('page-link')) {
        const selectedPage = parseInt(event.target.getAttribute('data-page'));


        if (!isNaN(selectedPage)) {
            statisticsCurrentPage = selectedPage;


            displayStatistics(sortedStatisticsUsers.length ? sortedStatisticsUsers : validUsers, statisticsCurrentPage);
            setupStatisticsPagination(sortedStatisticsUsers.length ? sortedStatisticsUsers : validUsers);
            updateStatisticsSortIndicators();
        }
    }
});

statisticsTableHeaders.forEach(header => {
    header.addEventListener('click', function() {
        const sortBy = this.getAttribute('data-sort');
        sortStatisticsTable(sortBy);
    });
});

function initializeStatistics() {
    sortedStatisticsUsers = [...validUsers];
    displayStatistics(sortedStatisticsUsers, statisticsCurrentPage);
    setupStatisticsPagination(sortedStatisticsUsers);
    updateStatisticsSortIndicators();
}

const formattedUsers = mergeUsers(randomUserMock, additionalUsers);
const { validUsers, invalidUsers } = validateUsers(formattedUsers);

invalidUsers.forEach(user => {
    console.log(`User ${user.full_name} has validation errors:`, user.validationErrors);
});

console.log('Valid Users:', validUsers);

initializeStatistics();

const teacherList = document.getElementById('teacher-list');
function createTeacherCard(teacher) {
    const teacherCard = document.createElement('div');
    teacherCard.classList.add('teacher-card');
    teacherCard.setAttribute('data-teacher-id', teacher.id);

    // Якщо немає фото, використовуємо ініціали
    let profileContent;
    if (teacher.picture_large) {
        profileContent = `<img class="profile-circle" src="${teacher.picture_large}" alt="${teacher.full_name}">`;
    } else {
        const initials = teacher.full_name.split(' ').map(n => n[0]).join(''); // Отримуємо ініціали
        profileContent = `<div class="profile-circle initials">${initials}</div>`;
    }

    teacherCard.innerHTML = `
    ${teacher.favorite ? '<span class="star">&#11088;</span>' : ''} <!-- Додаємо зірочку, якщо викладач у фаворитах -->
    ${profileContent}
    <h3>${teacher.full_name}</h3>
    <div >${teacher.course}</div>
    <div>${teacher.country}</div>
    <button class="view-details-btn" data-id="${teacher.id}">View Details</button>
    
  `;

    const star = teacherCard.querySelector('.star');
    if (star) {
        star.addEventListener('click', function() {
            toggleFavorite(teacher.id); // Викликаємо функцію toggleFavorite для додавання/видалення з улюблених
        });
    }

    return teacherCard;
}

function displayTeachers(teachers) {
    console.log(teachers); // Додаємо це для перевірки вхідних даних
    teacherList.innerHTML = '';
    teachers.forEach(teacher => {
        const teacherCard = createTeacherCard(teacher);
        teacherList.appendChild(teacherCard);
    });
}


displayTeachers(validUsers);

teacherList.addEventListener('click', function(event) {
    if (event.target.classList.contains('view-details-btn')) {
        const id = event.target.getAttribute('data-id');
        viewTeacherDetails(id);
    }

    if (event.target.classList.contains('toggle-favorite-btn')) {
        const id = event.target.getAttribute('data-id');
        toggleFavorite(id);
    }


});

function viewTeacherDetails(id) {

    const teacher = validUsers.find(user => user.id === id);

    openModalWithTeacherDetails(teacher);
}

function toggleFavorite(id) {
    const teacher = validUsers.find(user => user.id === id);
    if (!teacher) {
        console.error('Teacher not found:', id);
        return;
    }
    teacher.favorite = !teacher.favorite;
    userFavorites.set(teacher.id, teacher.favorite);

    // Оновлюємо список обраних викладачів
    favoriteTeachers = validUsers.filter(user => user.favorite);

    // Скидаємо індекс поточного слайда
    currentSlideIndex = 0;

    updateCarousel();
    updateTeacherList();
}


function openModalWithTeacherDetails(teacher) {
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
                        <label><strong>Course:</strong> <label class="subject">${teacher.course}</label></label>
                        <label class="country"><strong>Country:</strong> ${teacher.country}</label>
                        <label class="email"><strong>Email:</strong> <a href="mailto:${teacher.email}">${teacher.email}</a></label>
                        <label class="phone"><strong>Phone:</strong> ${teacher.phone}</label>
                    </span>
                    </span>
                </div>
                <label><strong>Note:</strong> ${teacher.note || 'N/A'}</label>
                <span class="star" id="favorite-star" style="font-size: 30px; cursor: pointer;">
                    ${teacher.favorite ? '&#11088;' : '&#9734;'}
                </span>
            </div>
        </div>
    `;

    // Отримуємо елемент зірочки
    const favoriteStar = document.getElementById('favorite-star');

    // Додаємо обробник події для натискання на зірочку
    favoriteStar.addEventListener('click', () => {
        // Змінюємо статус "улюбленого" для викладача
        teacher.favorite = !teacher.favorite;

        // Оновлюємо вигляд зірочки залежно від нового статусу
        favoriteStar.innerHTML = teacher.favorite ? '&#11088;' : '&#9734;';

        // Оновлюємо список улюблених викладачів у мапі
        userFavorites.set(teacher.id, teacher.favorite);

        // Оновлюємо список улюблених викладачів
        favoriteTeachers = validUsers.filter(user => user.favorite);

        // Оновлюємо список викладачів і карусель улюблених викладачів
        updateTeacherList();
        updateCarousel();
    });

    const addTeacherBtns = document.querySelectorAll('.add-teacher-btn'); // Вибір усіх кнопок з класом

    addTeacherBtns.forEach(button => {
        button.addEventListener('click', () => {
            addTeacherModal.style.display = 'block'; // Відкриваємо модальне вікно
        });
    });

    const closeBtns = document.querySelectorAll('.close-btn'); // Вибір усіх кнопок з класом

    closeBtns.forEach(button => {
        button.addEventListener('click', () => {
            addTeacherModal.style.display = 'none';
        });
    });





    modal.style.display = 'block';


    document.getElementById('blur').style.filter = 'blur(5px)';
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('close-btn')) {
        document.getElementById('modal').style.display = 'none';
        // Remove blur effect
        document.getElementById('blur').style.filter = 'none';
    }
    updateTeacherList();
});

const statisticsHeader = document.getElementById('statistics-header');

statisticsHeader.addEventListener('click', function(event) {
    event.preventDefault();
    resetSorting();
});

function resetSorting() {
    statisticsSort = { column: null, order: 'ascending' };
    sortedStatisticsUsers = [...validUsers];
    statisticsCurrentPage = 1;
    displayStatistics(sortedStatisticsUsers, statisticsCurrentPage);
    setupStatisticsPagination(sortedStatisticsUsers);
    updateStatisticsSortIndicators();
}


window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';

        document.getElementById('blur').style.filter = 'none';
    }
});


const ageFilter = document.getElementById('age');
const regionFilter = document.getElementById('region');
const sexFilter = document.getElementById('sex');
const photoFilter = document.querySelector('input[name="photo"]');
const favoritesFilter = document.querySelector('input[name="favorites"]');
const searchBtn = document.querySelector('.search-btn');
const searchBar = document.querySelector('.search-bar');
const clearFiltersBtn = document.querySelector('.clear-filters-btn');
function updateTeacherList() {
    let filtered = [...validUsers];

    // Фільтрація за віком
    if (ageFilter.value !== 'all') {
        const [minAge, maxAge] = ageFilter.value.split('-').map(Number);
        filtered = filtered.filter(user => user.age >= minAge && user.age <= maxAge);
    }


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

    // Пошук за текстом або числом
    const searchQuery = searchBar.value.trim().toLowerCase();
    if (searchQuery) {
        filtered = searchUsersByCriteria(filtered, searchQuery);
    }


    if (filtered.length === 0) {
        teacherList.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
            <p style="color: red; font-size: 20px">Unfortunately, there are not such teachers</p>
        </div>`;
    } else {

        displayTeachers(filtered);
    }

    //Оновлюємо статистику

    sortedStatisticsUsers = sortUsers([...filtered], statisticsSort.column, statisticsSort.order);
    statisticsCurrentPage = 1;
    displayStatistics(sortedStatisticsUsers, statisticsCurrentPage);
    setupStatisticsPagination(sortedStatisticsUsers);
    updateStatisticsSortIndicators();
}

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
function clearFilters() {
    // Очищення значень фільтрів
    ageFilter.value = 'all';
    regionFilter.value = 'all';
    sexFilter.value = 'all';
    photoFilter.checked = false;
    favoritesFilter.checked = false;
    searchBar.value = '';

    // Відновлення списку користувачів та оновлення сторінок
    displayTeachers(validUsers);
    initializeStatistics(); // Ініціалізація таблиці статистики
    currentPage = 1; // Оновлюємо сторінку на першу
    updatePaginationState(); // Оновлюємо стан пагінації
}

ageFilter.addEventListener('change', updateTeacherList);
regionFilter.addEventListener('change', updateTeacherList);
sexFilter.addEventListener('change', updateTeacherList);
photoFilter.addEventListener('change', updateTeacherList);
favoritesFilter.addEventListener('change', updateTeacherList);
searchBtn.addEventListener('click', updateTeacherList);
clearFiltersBtn.addEventListener('click', clearFilters);

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

// --- ADDITION: Add Teacher Functionality ---

// Get modal elements and buttons
// Отримуємо елементи модального вікна та кнопки
const addTeacherModal = document.getElementById('add-teacher-modal');
const addTeacherBtn = document.querySelectorAll('.add-teacher-btn'); // Може бути декілька кнопок
const closeAddTeacherBtn = document.querySelector('.close-btn');

// Відкриваємо модальне вікно при натисканні на кнопку "Add teacher"
addTeacherBtn.forEach(button => {
    button.addEventListener('click', () => {
        addTeacherModal.style.display = 'block';
    });
});

// Закриваємо модальне вікно при натисканні на кнопку закриття
closeAddTeacherBtn.addEventListener('click', () => {
    addTeacherModal.style.display = 'none';
});

// Закриваємо модальне вікно при натисканні поза ним
window.addEventListener('click', (event) => {
    if (event.target == addTeacherModal) {
        addTeacherModal.style.display = 'none';
    }
});


function addNewTeacher(teacherData) {
    const birthDate = teacherData.dob || '';

    // Формуємо об'єкт викладача
    const newTeacher = {
        id: generateUniqueId(),
        full_name: teacherData.full_name,
        gender: teacherData.gender,
        age: calculateAge(birthDate),
        b_date: birthDate,
        country: teacherData.country,
        email: teacherData.email,
        phone: teacherData.phone,
        course: teacherData.course,
        note: teacherData.note || '',
        favorite: false, // За замовчуванням не в улюблених
        picture_large: teacherData.picture_large, // Assuming picture_large is the file input from the form
        bg_color: getRandomColor(),
    };



    validUsers.push(newTeacher);


    updateTeacherList();


    addTeacherModal.style.display = 'none';


    addTeacherForm.reset();
}

const addTeacherForm = document.getElementById('add-teacher-form');
addTeacherForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Отримуємо дані з форми
    const formData = new FormData(addTeacherForm);
    const teacherData = Object.fromEntries(formData.entries());


    addNewTeacher(teacherData);


    initializeStatistics();


    updateCarousel();
});


const closeBtns = document.querySelectorAll('.close-btn'); // Вибір усіх кнопок з класом
closeBtns.forEach(button => {
    button.addEventListener('click', () => {
        addTeacherModal.style.display = 'none'; // Закриття модального вікна
    });
});



let favoriteTeachers = validUsers.filter(user => user.favorite);
let currentSlideIndex = 0;

const carouselSlide = document.getElementById('favorites-carousel');
const leftArrow = document.querySelector('.left-arrow');
const rightArrow = document.querySelector('.right-arrow');
function updateCarousel() {

    carouselSlide.innerHTML = '';

    const itemsPerSlide = 10; // Встановлюємо кількість елементів на один слайд

    if (favoriteTeachers.length === 0) {
        carouselSlide.innerHTML = '<p>No favorite teachers available.</p>';
        leftArrow.style.display = 'none';
        rightArrow.style.display = 'none';
        return;
    }

    favoriteTeachers.forEach(teacher => {
        const slideItem = document.createElement('div');
        slideItem.classList.add('teacher-card'); // Додаємо клас для картки викладача

        let profileContent;

        if (teacher.picture_large) {

            profileContent = `
                <picture>
                    <img src="${teacher.picture_large}" width="200" height="200" alt="${teacher.full_name}">
                </picture>
            `;
        } else {
            // Якщо фото немає, додаємо блок з ініціалами
            const initials = teacher.full_name.split(' ').map(n => n[0]).join(''); // Отримуємо ініціали
            profileContent = `
                <div class="profile-circle">
                    <span class="initials">${initials}</span>
                </div>
            `;
        }

        // Створюємо HTML для картки викладача
        slideItem.innerHTML = `
            ${profileContent}
            <h3 class="name">${teacher.full_name}</h3>
            <label class="country">${teacher.country}</label>
        `;

        carouselSlide.appendChild(slideItem);
    });

    // Оновлюємо стрілки
    const totalSlides = Math.ceil(favoriteTeachers.length / itemsPerSlide);
    if (totalSlides <= 1) {
        leftArrow.style.display = 'none';
        rightArrow.style.display = 'none';
    } else {
        leftArrow.style.display = 'block';
        rightArrow.style.display = 'block';
    }


// Додаємо обробники подій один раз
    leftArrow.addEventListener('click', slideLeft);
    rightArrow.addEventListener('click', slideRight);

    // Встановлюємо початкову позицію каруселі
    currentSlideIndex = 0;
    carouselSlide.style.transform = `translateX(0)`;
}

function slideLeft() {
    const totalSlides = Math.ceil(favoriteTeachers.length / itemsPerSlide);
    if (totalSlides === 0) return;

    currentSlideIndex = (currentSlideIndex - 1 + totalSlides) % totalSlides;
    carouselSlide.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
}

function slideRight() {
    const totalSlides = Math.ceil(favoriteTeachers.length / itemsPerSlide);
    if (totalSlides === 0) return;

    currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
    carouselSlide.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
}document.querySelectorAll('.categories-menu nav a').forEach(link => {
    link.addEventListener('click', function (event) {
        event.preventDefault();  // Запобігаємо стандартному переходу

        const target = this.getAttribute('data-target');  // Отримуємо значення data-target

        // Видаляємо клас 'active' у всіх посиланнях
        document.querySelectorAll('.categories-menu nav a').forEach(nav => {
            nav.classList.remove('active');
        });

        // Додаємо клас 'active' для всіх посилань з тим самим data-target
        document.querySelectorAll(`.categories-menu nav a[data-target="${target}"]`).forEach(nav => {
            nav.classList.add('active');
        });


        const targetSection = document.getElementById(target);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});


document.addEventListener('DOMContentLoaded', fetchUsers);
updateCarousel();