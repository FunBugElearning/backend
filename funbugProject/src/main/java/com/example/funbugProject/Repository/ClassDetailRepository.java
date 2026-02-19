package com.example.funbugProject.Repository;

import com.example.funbugProject.Entity.Classroom;
import com.example.funbugProject.Entity.ClassroomDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClassDetailRepository extends JpaRepository<ClassroomDetail, Integer> {
    @Query("SELECT c FROM ClassroomDetail c WHERE c.classroomId.className LIKE CONCAT('%', :name, '%')")
    List<ClassroomDetail> findByClassromName(@Param("name") String name);
}
