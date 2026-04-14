package com.hnust.easyweibo.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.hnust.easyweibo.backend.config.AppProperties;
import com.hnust.easyweibo.backend.domain.dto.upload.UploadResponse;
import com.hnust.easyweibo.backend.exception.ApiException;

@Service
public class UploadService {

    private final Path uploadRoot;

    public UploadService(AppProperties appProperties) {
        this.uploadRoot = Paths.get(appProperties.getUploadDir()).toAbsolutePath();
    }

    public UploadResponse uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "请选择要上传的图片");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "只支持图片上传");
        }

        try {
            Files.createDirectories(uploadRoot);
            String originalFilename = file.getOriginalFilename() == null
                ? "image"
                : Paths.get(file.getOriginalFilename()).getFileName().toString().replaceAll("[^A-Za-z0-9._-]", "_");
            String filename = UUID.randomUUID() + "-" + originalFilename;
            Path target = uploadRoot.resolve(filename);
            file.transferTo(target);
            return new UploadResponse("/uploads/" + filename);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "图片上传失败");
        }
    }
}
