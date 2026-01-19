package com.example.funbugProject.Repository;

import com.example.funbugProject.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    @Query("SELECT c FROM User c WHERE c.email = :email")
    Optional<User> findByUserEmail(@Param("email") String email);

    @Query("SELECT c FROM User c WHERE c.name LIKE %:name% ")
    List<User> findByName(@Param("name") String name);

    @Query("SELECT c FROM User c WHERE c.email = :email")
    boolean existsByCustomerEmail(String email);
}
