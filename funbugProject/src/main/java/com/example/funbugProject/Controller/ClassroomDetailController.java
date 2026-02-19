package com.example.funbugProject.Controller;

import com.example.funbugProject.Entity.ClassroomDetail;
import com.example.funbugProject.Service.ClassroomDetailService;
import com.example.funbugProject.dto.ClasroomDetailCreateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/classroom-details")
public class ClassroomDetailController {

    @Autowired
    private ClassroomDetailService classroomDetailService;

    @PostMapping
    public ClassroomDetail addUserToClassroom(@RequestBody ClasroomDetailCreateRequest body) {
        return classroomDetailService.addUserToClassroom(body);
    }

    @GetMapping
    public List<ClassroomDetail> getAllClassroomDetails() {
        return classroomDetailService.getAllClassroomDetails();
    }

    @GetMapping("/{id}")
    public Optional<ClassroomDetail> getClassroomDetailByStudentId(@PathVariable int id) {
        return classroomDetailService.getClassroomDetailByStudentId(id);
    }

    @PutMapping("/{id}")
    public ClassroomDetail updateClassroomDetail(@PathVariable int id, @RequestBody ClassroomDetail classroomDetail) {
        return classroomDetailService.updateClassroomDetail(id, classroomDetail);
    }

    @DeleteMapping("/{id}")
    public void deleteClassroomDetail(@PathVariable int id) {
        classroomDetailService.deleteClassroomDetail(id);
    }
}
