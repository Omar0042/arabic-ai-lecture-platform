// نظام تخزين البيانات
class StorageSystem {
  constructor() {
    this.storageKey = 'university_platform_data';
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        lectures: [],
        students: [
          {
            id: 1,
            name: "محمد الطالب",
            email: "mohamed@example.com",
            courses: []
          }
        ],
        teachers: [
          {
            id: 1,
            name: "د. أحمد محمد",
            email: "ahmed@university.edu"
          }
        ]
      };
      localStorage.setItem(this.storageKey, JSON.stringify(initialData));
    }
  }

  getData() {
    return JSON.parse(localStorage.getItem(this.storageKey));
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // إدارة المحاضرات
  getLectures() {
    return this.getData().lectures;
  }

  getLectureById(id) {
    return this.getLectures().find(lecture => lecture.id === id);
  }

  addLecture(lecture) {
    const data = this.getData();
    const newId = data.lectures.length > 0 
      ? Math.max(...data.lectures.map(l => l.id)) + 1 
      : 1;
    lecture.id = newId;
    data.lectures.push(lecture);
    this.saveData(data);
    return newId;
  }

  updateLecture(id, updatedLecture) {
    const data = this.getData();
    const index = data.lectures.findIndex(l => l.id === id);
    if (index !== -1) {
      data.lectures[index] = { ...data.lectures[index], ...updatedLecture };
      this.saveData(data);
      return true;
    }
    return false;
  }

  deleteLecture(id) {
    const data = this.getData();
    const initialLength = data.lectures.length;
    data.lectures = data.lectures.filter(l => l.id !== id);
    
    // إزالة المحاضرة من قوائم الطلاب
    data.students.forEach(student => {
      student.courses = student.courses.filter(courseId => courseId !== id);
    });
    
    this.saveData(data);
    return initialLength !== data.lectures.length;
  }

  // إدارة الطلاب
  getStudents() {
    return this.getData().students;
  }

  getStudentById(id) {
    return this.getStudents().find(student => student.id === id);
  }

  enrollStudent(studentId, lectureId) {
    const data = this.getData();
    const student = data.students.find(s => s.id === studentId);
    if (student && !student.courses.includes(lectureId)) {
      student.courses.push(lectureId);
      this.saveData(data);
      return true;
    }
    return false;
  }

  unenrollStudent(studentId, lectureId) {
    const data = this.getData();
    const student = data.students.find(s => s.id === studentId);
    if (student) {
      student.courses = student.courses.filter(id => id !== lectureId);
      this.saveData(data);
      return true;
    }
    return false;
  }

  // إدارة المعلمين
  getTeachers() {
    return this.getData().teachers;
  }

  getLecturesByTeacher(teacherId) {
    const teacher = this.getTeachers().find(t => t.id === teacherId);
    if (!teacher) return [];
    
    return this.getLectures().filter(lecture => lecture.teacherId === teacherId);
  }
}

// إنشاء نسخة واحدة من نظام التخزين
const universityStorage = new StorageSystem();