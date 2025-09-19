package com.example.funbugProject.Controller;

import com.example.funbugProject.Entity.Score;
import com.example.funbugProject.Service.ScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    @Autowired
    private ScoreService scoreService;

    @GetMapping
    public List<Score> getAllScores() {
        return scoreService.getAll();
    }

    @PostMapping
    public Score createScore(@RequestBody Score score) {
        return scoreService.createScore(score);
    }

    @PutMapping("/{id}")
    public Score updateScore(@PathVariable int id, @RequestBody Score score) {
        return scoreService.updateScore(id, score);
    }

    @DeleteMapping("/{id}")
    public void deleteScore(@PathVariable int id) {
        scoreService.deleteScore(id);
    }

    @GetMapping("/user/{userId}")
    public List<Score> getScoresByUser(@PathVariable int userId) {
        return scoreService.getByStudentId(userId);
    }
}