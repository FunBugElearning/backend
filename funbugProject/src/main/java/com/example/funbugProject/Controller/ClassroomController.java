package com.example.funbugProject.Controller;

import com.example.funbugProject.dto.ClassroomCreateRequest;
import com.example.funbugProject.Entity.Classroom;
import com.example.funbugProject.Service.ClassroomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/classrooms")
public class ClassroomController {

    @Autowired
    private ClassroomService classroomService;

    @GetMapping
    public List<Classroom> getAllClassrooms() {
        return classroomService.getAll();
    }

    @PostMapping
    public Classroom createClassroom(@RequestBody ClassroomCreateRequest body) {
        return classroomService.createClassroom(body);
    }

    @PutMapping("/{id}")
    public Classroom updateClassroom(@PathVariable int id, @RequestBody Classroom classroom) {
        return classroomService.updateClassroom(id, classroom);
    }

    @DeleteMapping("/{id}")
    public void deleteClassroom(@PathVariable int id) {
        classroomService.deleteClassroom(id);
    }

    @GetMapping("/teacher/{teacherId}")
    public List<Classroom> getClassroomsByTeacher(@PathVariable int teacherId) {
        return classroomService.getByTeacherId(teacherId);
    }
}
