package com.example.funbugProject.Service;

import com.example.funbugProject.Entity.Score;
import com.example.funbugProject.Repository.ScoreRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ScoreService {

    private final ScoreRepository scoreRepository;

    public ScoreService(ScoreRepository scoreRepository) {
        this.scoreRepository = scoreRepository;
    }

    public List<Score> getAllScores() {
        return scoreRepository.findAll();
    }

    public Optional<Score> getScoreById(int id) {
        return scoreRepository.findById(id);
    }

    public Score createScore(Score score) {
        return scoreRepository.save(score);
    }

    public Score updateScore(int id, Score updatedScore) {
        return scoreRepository.findById(id)
                .map(existing -> {
                    existing.setSubject(updatedScore.getSubject());
                    existing.setAttendanceScore(updatedScore.getAttendanceScore());
                    existing.setHomeworkScore(updatedScore.getHomeworkScore());
                    existing.setExamScore(updatedScore.getExamScore());
                    return scoreRepository.save(existing);
                })
                .orElse(null);
    }

    public boolean deleteScore(int id) {
        if (scoreRepository.existsById(id)) {
            scoreRepository.deleteById(id);
            return true;
        }
        return false;
    }
}