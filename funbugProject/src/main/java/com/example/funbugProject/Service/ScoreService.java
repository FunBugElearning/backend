package com.example.funbugProject.Service;

import com.example.funbugProject.Entity.Score;
import com.example.funbugProject.Repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScoreService {

    @Autowired
    private ScoreRepository scoreRepository;

    public List<Score> getAll() {
        return scoreRepository.findAll();
    }

    public Score createScore(Score score) {
        return scoreRepository.save(score);
    }

    public Score updateScore(int id, Score score) {
        score.setId(id);
        return scoreRepository.save(score);
    }

    public void deleteScore(int id) {
        scoreRepository.deleteById(id);
    }

    // Lấy điểm của học sinh
    public List<Score> getByStudentId(int studentId) {
        return scoreRepository.findAll().stream()
                .filter(s -> s.getStudent() != null && s.getStudent().getId() == studentId)
                .toList();
    }
}
