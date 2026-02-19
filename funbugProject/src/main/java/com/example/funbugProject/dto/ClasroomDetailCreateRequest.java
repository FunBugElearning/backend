package com.example.funbugProject.dto;

import com.example.funbugProject.Entity.ClassroomDetail;
import com.example.funbugProject.Entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ClasroomDetailCreateRequest {
    private int id;
    private ClassroomDetail classroomDetail;
    private User studentId;
}
