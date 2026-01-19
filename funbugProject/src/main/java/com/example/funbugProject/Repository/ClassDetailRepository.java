package com.example.funbugProject.Repository;

import com.example.funbugProject.Entity.Classroom;
import com.example.funbugProject.Entity.ClassroomDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClassDetailRepository extends JpaRepository<ClassroomDetail, Integer> {

}
