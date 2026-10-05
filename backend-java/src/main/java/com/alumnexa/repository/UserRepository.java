package com.alumnexa.repository;

import com.alumnexa.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(String role);
    List<User> findByInstitutionId(String institutionId);
    List<User> findByVerificationStatus(String verificationStatus);
    long countByRole(String role);
    long countByInstitutionId(String institutionId);
}
