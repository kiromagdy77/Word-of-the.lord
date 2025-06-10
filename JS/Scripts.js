document.addEventListener("DOMContentLoaded", function () {
  // Daily Verse Functionality
  async function loadDailyVerse() {
    try {
      const response = await fetch('JS/Data/Bible-AR/verses.json');
      if (!response.ok) {
        throw new Error('Failed to load verses');
      }
      const data = await response.json();
      const verses = data.verses;
      const randomIndex = Math.floor(Math.random() * verses.length);
      const verse = verses[randomIndex];
      
      const versesElement = document.getElementById('verses');
      if (versesElement) {
        versesElement.innerHTML = `${verse.text}<span>(${verse.reference})</span>`;
      }
    } catch (error) {
      console.error('Error loading daily verse:', error);
    }
  }

  // Load the daily verse when the page loads
  loadDailyVerse();

  // Agpeya Prayer Functionality
  async function loadPrayerContent(prayerName, filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('Failed to load prayer content');
      }
      const data = await response.json();
      
      // Find the prayer data - handle variations in prayer names
      let prayer = data[0].prayers[0]; // Since each file contains only one prayer
      if (!prayer) {
        throw new Error('Prayer not found');
      }

      // Get the select and paragraph elements
      const selectElement = document.getElementById('agpeya-container-prayers-text-select');
      const textElement = document.querySelector('.agpeya-container-prayers-text p');

      if (!selectElement || !textElement) {
        throw new Error('Required elements not found');
      }

      // Clear existing options
      selectElement.innerHTML = '<option value="" disabled>الرجاء اختيار الصلاة</option>';

      // Add options for each section
      prayer.sections.forEach((section, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = section.section_title;
        selectElement.appendChild(option);
      });

      // Function to display section content
      const displaySection = (selectedIndex) => {
        const selectedSection = prayer.sections[selectedIndex];
        if (selectedSection) {
          let content = '';
          
          if (selectedSection.content) {
            content = selectedSection.content.join('\n\n');
          } else if (selectedSection.psalms) {
            content = selectedSection.psalms.map(psalm => 
              `المزمور ${psalm.number}\n${psalm.text}`
            ).join('\n\n');
          } else if (selectedSection.text) {
            content = selectedSection.text;
          }
          
          textElement.innerHTML = content.replace(/\n/g, '<br>');
        }
      };

      // Add change event listener to select element
      selectElement.onchange = function() {
        displaySection(this.value);
      };

      // Automatically select and display the first section
      selectElement.value = "0";
      displaySection(0);

    } catch (error) {
      console.error('Error loading prayer content:', error);
    }
  }

  // Prayer file mappings
  const prayerFiles = {
    'صلاة باكر': 'JS/Data/Agpeya/صلاة-باكر.json',
    'صلاة الساعة الثالثة': 'JS/Data/Agpeya/الساعة-الثالثة.json',
    'صلاة الساعة السادسة': 'JS/Data/Agpeya/الساعة-السادسة.json',
    'صلاة الساعة التاسعة': 'JS/Data/Agpeya/الساعة-التاسعة.json',
    'صلاة الساعة الحادية عشر (الغروب)': 'JS/Data/Agpeya/الحادية-عشر-(الغروب).json',
    'صلاة الساعة الثانية عشر (النوم)': 'JS/Data/Agpeya/الثانية-عشر-(النوم).json',
    'صلاة الستار': 'JS/Data/Agpeya/صلاة-الستار.json',
    'صلاة نصف اليل الخدمة الاولي': 'JS/Data/Agpeya/نصف-الليل-الاولى.json',
    'صلاة نصف اليل الخدمة الثانية': 'JS/Data/Agpeya/نصف-الليل-الثانية.json',
    'صلاة نصف اليل الخدمة الثالثة': 'JS/Data/Agpeya/نصف-الليل-الثالثة.json',
    'صلوات اخري': null
  };

  // Add click event listeners to prayer buttons
  const prayerButtons = document.querySelectorAll('.agpeya-container-prayers-name-btns button');
  if (prayerButtons) {
    prayerButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        prayerButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        
        const prayerName = this.textContent;
        const prayerFile = prayerFiles[prayerName];
        
        if (prayerFile) {
          loadPrayerContent(prayerName, prayerFile);
        }
      });
    });
  }

  // Bible functionality
  const availableBooks = [
    { name: "تكوين", path: "JS/Data/Bible-AR/Old Testament/سفر-التكوين.json", bookNumber: 1 },
    { name: "خروج", path: "JS/Data/Bible-AR/Old Testament/سفر-الخروج.json", bookNumber: 2 },
    { name: "اللاويين", path: "JS/Data/Bible-AR/Old Testament/سفر-اللاويين.json", bookNumber: 3 },
    { name: "عدد", path: "JS/Data/Bible-AR/Old Testament/سفر-العدد.json", bookNumber: 4 },
    { name: "التثنية", path: "JS/Data/Bible-AR/Old Testament/سفر-التثنية.json", bookNumber: 5 },
    { name: "متى", path: "JS/Data/Bible-AR/New Testament/انجيل-متي.json", bookNumber: 6 },
    { name: "مرقس", path: "JS/Data/Bible-AR/New Testament/انجيل-مرقس.json", bookNumber: 7 },
    { name: "لوقا", path: "JS/Data/Bible-AR/New Testament/انجيل-لوقا.json", bookNumber: 8 },
    { name: "يوحنا", path: "JS/Data/Bible-AR/New Testament/انجيل-يوحنا.json", bookNumber: 9 },
  ];

  const bookSelect = document.getElementById("book-select"); // السفر المختار
  const chapterSelect = document.getElementById("chapter-select"); // الإصحاح المختار
  const verseSelect = document.getElementById("verse-select"); // الآية المختارة
  const bibleContentArea = document.getElementById("bible-content-area"); 

  let currentBookData = null; // لتخزين بيانات السفر المحمل حاليًا
  let currentChapterData = null; // لتخزين بيانات الإصحاح المحمل حاليًا

  // ب. ملء قائمة اختيار الأسفار
  function populateBookSelect() {
    bookSelect.innerHTML = '<option value="" disabled selected>اختر السفر</option>'; // Reset with placeholder
    availableBooks.forEach((book) => {
      const option = document.createElement("option");
      option.value = book.path;
      option.textContent = book.name;
      bookSelect.appendChild(option);
    });
    console.log('Books populated:', availableBooks);
  }

  // ج. تحميل بيانات السفر المختار
  async function loadBook(bookPath) {
    console.log('Loading book from path:', bookPath);
    if (!bookPath) {
      console.log('No book path provided');
      currentBookData = null;
      populateChapterSelect(null);
      bibleContentArea.innerHTML = '<div class="verse-display-container"><p>الرجاء اختيار الاصحاح</p></div>';
      return;
    }
    try {
      // First, try to verify if the file exists
      const checkResponse = await fetch(bookPath, { method: 'HEAD' });
      if (!checkResponse.ok) {
        console.error('File not found:', bookPath);
        throw new Error(`File not found: ${bookPath}`);
      }

      const response = await fetch(bookPath);
      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text(); // Get the raw text first
      console.log('Received text:', text.substring(0, 100) + '...'); // Log the first 100 characters

      const data = JSON.parse(text); // Parse it separately to catch JSON parsing errors
      console.log('Parsed data:', data);

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Invalid data format:', data);
        throw new Error('Invalid data format');
      }

      currentBookData = data[0];
      console.log('Current book data:', currentBookData);

      if (!currentBookData.chapters || !Array.isArray(currentBookData.chapters)) {
        console.error('Invalid chapters format:', currentBookData);
        throw new Error('Invalid chapters format');
      }

      populateChapterSelect(currentBookData);
      bibleContentArea.innerHTML = "<p>الرجاء اختيار إصحاح.</p>";
    } catch (error) {
      console.error('Detailed error:', error);
      bibleContentArea.innerHTML = `<p>عفواً، حدث خطأ أثناء تحميل بيانات السفر: ${error.message}</p>`;
      currentBookData = null;
      populateChapterSelect(null);
    }
  }

  // د. ملء قائمة اختيار الإصحاحات بناءً على السفر المختار
  function populateChapterSelect(bookData) {
    console.log('Populating chapters with book data:', bookData);
    chapterSelect.innerHTML = '<option value="" disabled selected></option>';
    
    if (!bookData || !bookData.chapters) {
      console.log('No valid book data for chapters');
      return;
    }

    try {
      bookData.chapters.forEach((chapter) => {
        if (!chapter || !chapter.chapter_number) {
          console.error('Invalid chapter data:', chapter);
          return;
        }
        const option = document.createElement("option");
        option.value = chapter.chapter_number;
        option.textContent = `الإصحاح ${chapter.chapter_number}`;
        chapterSelect.appendChild(option);
      });
      console.log('Successfully added chapters:', bookData.chapters.length);
    } catch (error) {
      console.error('Error populating chapters:', error);
    }
  }

  // Function to populate verse select
  function populateVerseSelect(chapterData) {
    verseSelect.innerHTML = '<option value="" disabled selected>اختر الآية</option>';
    if (!chapterData || !chapterData.verses) {
      return;
    }
    chapterData.verses.forEach((verse) => {
      const option = document.createElement("option");
      option.value = verse.verse_number;
      option.textContent = verse.verse_number;
      verseSelect.appendChild(option);
    });
  }

  // Function to display specific verse
  function displayVerse(verseNumber) {
    if (!currentChapterData || !verseNumber) {
      return;
    }

    const verse = currentChapterData.verses.find(
      (v) => v.verse_number == parseInt(verseNumber)
    );

    if (verse) {
      bibleContentArea.innerHTML = `<p><strong>(${verse.verse_number})</strong> ${verse.text}</p>`;
    }
  }

  // Update chapter display function
  function displayChapter(chapterNumber) {
    if (!currentBookData || !chapterNumber) {
      bibleContentArea.innerHTML = "<p>الرجاء اختيار سفر وإصحاح.</p>";
      return;
    }

    const chapterData = currentBookData.chapters.find(
      (chap) => chap.chapter_number == parseInt(chapterNumber)
    );

    if (chapterData) {
      currentChapterData = chapterData;
      populateVerseSelect(chapterData);
      
      if (!verseSelect.value) {
        bibleContentArea.innerHTML = `<h3 style="display:none;">${currentBookData.book_name} - الإصحاح ${chapterData.chapter_number}</h3>`;
        const versesList = document.createElement("ul");
        versesList.classList.add("verses");

        chapterData.verses.forEach((verse) => {
          const verseItem = document.createElement("li");
          verseItem.innerHTML = `<strong>(${verse.verse_number})</strong> ${verse.text}`;
          versesList.appendChild(verseItem);
        });
        bibleContentArea.appendChild(versesList);
      }
    } else {
      bibleContentArea.innerHTML = "<p>لم يتم العثور على بيانات الإصحاح.</p>";
    }
  }

  // Event listeners
  bookSelect.addEventListener("change", (event) => {
    const selectedBookPath = event.target.value;
    console.log('Selected book path:', selectedBookPath);
    verseSelect.innerHTML = '<option value="" disabled selected>اختر الآية</option>';
    loadBook(selectedBookPath).then(() => {
      if (chapterSelect.options.length > 1) {
        chapterSelect.value = "1";
        displayChapter("1");
      }
    });
  });

  chapterSelect.addEventListener("change", (event) => {
    const selectedChapterNumber = event.target.value;
    console.log('Selected chapter:', selectedChapterNumber);
    verseSelect.value = "";
    displayChapter(selectedChapterNumber);
  });

  verseSelect.addEventListener("change", (event) => {
    const selectedVerseNumber = event.target.value;
    console.log('Selected verse:', selectedVerseNumber);
    if (selectedVerseNumber) {
      displayVerse(selectedVerseNumber);
    } else {
      displayChapter(chapterSelect.value);
    }
  });

  // Initialize the book select on page load
  populateBookSelect();
  
  // Initialize with message
  if (bibleContentArea) {
    bibleContentArea.innerHTML = '<div class="verse-display-container" style="padding : 0px; margin: 0px;"><p>الرجاء اختيار السفر</p></div>';
  }

  //-----------------------------------------//

  // Search functionality
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const searchResults = document.getElementById("searchResults");

  // Function to load all books
  async function loadAllBooks() {
    console.log('Starting to load all books...');
    const allVerses = [];
    try {
      for (const book of availableBooks) {
        console.log(`Loading book: ${book.name} from path: ${book.path}`);
        const response = await fetch(book.path);
        if (!response.ok) {
          console.error(`Failed to load ${book.name}: ${response.status}`);
          continue;
        }
        const data = await response.json();
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.error(`Invalid data format for ${book.name}`);
          continue;
        }
        
        const bookData = data[0];
        console.log(`Successfully loaded ${book.name} with ${bookData.chapters.length} chapters`);
        
        bookData.chapters.forEach(chapter => {
          chapter.verses.forEach(verse => {
            allVerses.push({
              book: bookData.book_name,
              chapter: chapter.chapter_number,
              verse: verse.verse_number,
              text: verse.text
            });
          });
        });
      }
      console.log(`Total verses loaded: ${allVerses.length}`);
      return allVerses;
    } catch (error) {
      console.error('Error in loadAllBooks:', error);
      throw error;
    }
  }

  // Function to perform search
  async function performSearch(searchTerm) {
    console.log('Starting search for:', searchTerm);
    if (!searchTerm.trim()) {
      console.log('Empty search term');
      return;
    }
    
    if (!searchResults) {
      console.error('Search results container not found!');
      return;
    }

    searchResults.innerHTML = '<p style="text-align: center; font-family: \'Lateef\', cursive; font-size: 20px;">جاري البحث...</p>';
    
    try {
      const allVerses = await loadAllBooks();
      console.log('Searching through verses...');
      const results = allVerses.filter(verse => 
        verse.text.includes(searchTerm)
      );

      console.log(`Found ${results.length} results`);

      if (results.length === 0) {
        searchResults.innerHTML = '<p style="text-align: center; font-family: \'Lateef\', cursive; font-size: 20px;">لم يتم العثور على نتائج</p>';
        return;
      }

      const resultsHTML = results.map(result => `
        <div class="search-result">
          <p class="verse-text">
            <strong>${result.book} ${result.chapter}:${result.verse}</strong>
            ${result.text}
          </p>
        </div>
      `).join('');

      searchResults.innerHTML = `
        <h3>نتائج البحث (${results.length})</h3>
        <div class="search-results-container">
          ${resultsHTML}
        </div>
      `;
    } catch (error) {
      console.error('Search error:', error);
      searchResults.innerHTML = '<p style="text-align: center; font-family: \'Lateef\', cursive; font-size: 20px;">حدث خطأ أثناء البحث</p>';
    }
  }

  // Add event listeners for search
  if (searchBtn && searchInput) {
    console.log('Search elements found, adding event listeners');
    
    searchBtn.addEventListener("click", () => {
      console.log('Search button clicked');
      const searchTerm = searchInput.value;
      performSearch(searchTerm);
    });

    searchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        console.log('Enter key pressed in search input');
        const searchTerm = searchInput.value;
        performSearch(searchTerm);
      }
    });
  } else {
    console.error('Search elements not found:', {
      searchBtn: !!searchBtn,
      searchInput: !!searchInput,
      searchResults: !!searchResults
    });
  }
});