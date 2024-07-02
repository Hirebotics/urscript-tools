FROM --platform=linux/amd64 ubuntu:18.04

ARG ROBOT=UR10
ARG SIMULATOR_DIR=/ursimulator
ARG SIMULATOR_DOWNLOAD_URL=https://s3-eu-west-1.amazonaws.com/ur-support-site/224811/URSim_Linux-5.17.0.128818.tar.gz
ARG SIMULATOR_VERSION=5.17.0

RUN apt-get update -y &&\
    apt-get install -y --force-yes sudo wget libgcc1 libstdc++6 libc6 libcap2-bin
RUN ln -s /usr/bin/sudo /usr/bin/pkexec

RUN mkdir -p $SIMULATOR_DIR
RUN mkdir -p /root/Desktop

WORKDIR $SIMULATOR_DIR

RUN echo Download Simulator - $SIMULATOR_DOWNLOAD_URL
RUN wget -nc $SIMULATOR_DOWNLOAD_URL
RUN export SIMULATOR_FILE=$(basename $SIMULATOR_DOWNLOAD_URL) && tar --strip-components=2 -xvf $SIMULATOR_FILE

# optimize container by not installing dependencies that are not necessary
# to run the controller
RUN sed -i 's/^\s*needToInstallJava$/#needToInstallJava/' install.sh &&\
    sed -i 's/^\s*installDaemonManager$/#installDaemonManager/' install.sh &&\
    sed -i 's/^\s*tty -s$/#tty -s/' install.sh &&\
    sed -i 's/^\s*pushd/#pushd/' install.sh &&\
    sed -i 's/^\s*chmod/#chmod/' install.sh &&\
    sed -i 's/^\s*popd/#popd/' install.sh &&\
    sed -i 's/apt-get -y/apt-get -y --force-yes/g' install.sh

RUN HOME=/root DEBIAN_FRONTEND="noninteractive" ./install.sh

# Following enables modbus server to be launched by the URControl process
RUN sudo setcap cap_net_bind_service+ep URControl
RUN echo "/opt/urtool-3.0/lib/" > /etc/ld.so.conf.d/77urcontrol.conf
RUN ldconfig

RUN mv .urcontrol/urcontrol.conf.$ROBOT .urcontrol/urcontrol.conf
COPY safety.conf .urcontrol/safety.conf

RUN echo "LD_LIBRARY_PATH=/opt/urtool-3.0/lib HOME=/ursimulator /ursimulator/./URControl -m ${SIMULATOR_VERSION} -r | tee /ursimulator/URControl.log" > run-controller.sh
RUN chmod a+x run-controller.sh

EXPOSE 30001
EXPOSE 30002
EXPOSE 30003
EXPOSE 30004

ENTRYPOINT ["/bin/bash", "-c", "/ursimulator/run-controller.sh"]