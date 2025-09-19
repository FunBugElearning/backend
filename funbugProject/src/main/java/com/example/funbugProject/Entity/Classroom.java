package com.example.funbugProject.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@NoArgsConstructor
@Data
@AllArgsConstructor
@Entity
@Table(name = "classrooms")
@Builder
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name; // Tên lớp học

    @ManyToOne
    @JoinColumn(name = "teacher_id")
    private User teacher; // Giáo viên phụ trách

    @ManyToMany
    @JoinTable(
            name = "classroom_students",
            joinColumns = @JoinColumn(name = "classroom_id"),
            inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    private List<User> students;
}
