package com.example.funbugProject.dto;

import com.example.funbugProject.Entity.ClassroomDetail;
import com.example.funbugProject.Entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomCreateRequest {
    private int id;
    private String className;
    private User teacher;
    private List<ClassroomDetail> classroomDetails;
}
