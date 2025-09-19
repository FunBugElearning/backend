package com.example.funbugProject.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@NoArgsConstructor
@Data
@AllArgsConstructor
@Entity
@Table(name = "attendances")
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    private LocalDate date;

    private boolean present;
}