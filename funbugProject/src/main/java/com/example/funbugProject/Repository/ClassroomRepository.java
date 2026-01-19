package com.example.funbugProject.Repository;

import com.example.funbugProject.Entity.Classroom;
import com.example.funbugProject.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClassroomRepository extends JpaRepository<Classroom, Integer> {
    @Query("SELECT c FROM Classroom c WHERE c.className LIKE CONCAT('%', :name, '%')")
    List<Classroom> findByName(@Param("name") String name);
}
