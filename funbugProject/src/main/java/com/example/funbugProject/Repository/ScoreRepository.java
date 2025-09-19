package com.example.funbugProject.Repository;

import com.example.funbugProject.Entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreRepository extends JpaRepository<Score, Integer> {
}
