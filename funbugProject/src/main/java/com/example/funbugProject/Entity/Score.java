package com.example.funbugProject.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Score {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private double attendanceScore;

    @Column(nullable = false)
    private double homeworkScore;

    @Column(nullable = false)
    private double examScore;

    public double getFinalScore() {
        return attendanceScore * 0.2 + homeworkScore * 0.3 + examScore * 0.5;
    }
}