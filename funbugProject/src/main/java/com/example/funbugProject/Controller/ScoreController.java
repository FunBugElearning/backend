package com.example.funbugProject.Controller;

import com.example.funbugProject.Entity.Score;
import com.example.funbugProject.Service.ScoreService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/scores")
public class ScoreController {

    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @GetMapping
    public List<Score> getAllScores() {
        return scoreService.getAllScores();
    }


    @GetMapping("/{id}")
    public Optional<Score> getScoreById(@PathVariable int id) {
        return scoreService.getScoreById(id);
    }

    @PostMapping
    public Score createScore(@RequestBody Score score) {
        return scoreService.createScore(score);
    }

    @PutMapping("/{id}")
    public Score updateScore(@PathVariable int id, @RequestBody Score updatedScore) {
        return scoreService.updateScore(id, updatedScore);
    }

    @DeleteMapping("/{id}")
    public boolean deleteScore(@PathVariable int id) {
        return scoreService.deleteScore(id);
    }
}
