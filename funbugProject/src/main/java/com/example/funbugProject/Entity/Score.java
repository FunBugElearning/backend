package com.example.funbugProject.Entity;

import jakarta.persistence.*;
import lombok.*;

@NoArgsConstructor
@Data
@AllArgsConstructor
@Entity
@Table(name = "scores")
@Builder
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    private double value; // Điểm số

    private String description; // Chỉ số thi đua
}