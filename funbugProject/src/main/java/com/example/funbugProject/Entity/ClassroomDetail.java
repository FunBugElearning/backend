package com.example.funbugProject.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@NoArgsConstructor
@Data
@AllArgsConstructor
@Entity
@Table(name = "classroom_detail")
@Builder
@Setter
@Getter
public class ClassroomDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    // classroom
    @ManyToOne
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroomId;

    // student
    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User studentId;


}
